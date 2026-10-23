#!/usr/bin/env python3
"""
Python Static Analysis and Deployment Risk Predictor
Parses Python source files using AST, inspects requirements,
detects frameworks, syntax errors, and common deployment hazards.
"""

import os
import sys
import json
import ast
import re

# Standard library modules in Python 3.10+
STDLIB_MODULES = {
    'abc', 'aifc', 'argparse', 'array', 'ast', 'asynchat', 'asyncio', 'asyncore',
    'atexit', 'audioop', 'base64', 'bdb', 'binascii', 'binhex', 'bisect', 'builtins',
    'bz2', 'calendar', 'cgi', 'cgitb', 'chunk', 'cmath', 'cmd', 'code', 'codecs',
    'codeop', 'collections', 'colorsys', 'compileall', 'concurrent', 'configparser',
    'contextlib', 'contextvars', 'copy', 'copyreg', 'crypt', 'csv', 'ctypes',
    'curses', 'dataclasses', 'datetime', 'dbm', 'decimal', 'difflib', 'dis',
    'distutils', 'doctest', 'email', 'encodings', 'ensurepip', 'enum', 'errno',
    'faulthandler', 'fcntl', 'filecmp', 'fileinput', 'fnmatch', 'fractions',
    'ftplib', 'functools', 'gc', 'getopt', 'getpass', 'gettext', 'glob', 'graphlib',
    'grp', 'gzip', 'hashlib', 'heapq', 'hmac', 'html', 'http', 'idlelib', 'imaplib',
    'imghdr', 'imp', 'importlib', 'inspect', 'io', 'ipaddress', 'itertools',
    'json', 'keyword', 'lib2to3', 'linecache', 'locale', 'logging', 'lzma',
    'mailbox', 'mailcap', 'marshal', 'math', 'mimetypes', 'mmap', 'modulefinder',
    'msilib', 'msvcrt', 'multiprocessing', 'netrc', 'nis', 'nntplib', 'numbers',
    'operator', 'optparse', 'os', 'ossaudiodev', 'parser', 'pathlib', 'pdb',
    'pickle', 'pickletools', 'pipes', 'pkgutil', 'platform', 'plistlib', 'poplib',
    'posix', 'posixpath', 'pprint', 'profile', 'pstats', 'pty', 'pwd', 'py_compile',
    'pyclbr', 'pydoc', 'queue', 'quopri', 'random', 're', 'readline', 'reprlib',
    'resource', 'rlcompleter', 'runpy', 'sched', 'secrets', 'select', 'selectors',
    'shelve', 'shlex', 'shutil', 'signal', 'site', 'smtpd', 'smtplib', 'sndhdr',
    'socket', 'socketserver', 'spwd', 'sqlite3', 'ssl', 'stat', 'statistics',
    'string', 'stringprep', 'struct', 'subprocess', 'sunau', 'symbol', 'symtable',
    'sys', 'sysconfig', 'syslog', 'tabnanny', 'tarfile', 'telnetlib', 'tempfile',
    'termios', 'test', 'textwrap', 'threading', 'time', 'timeit', 'tkinter',
    'token', 'tokenize', 'trace', 'traceback', 'tracemalloc', 'tty', 'turtle',
    'turtledemo', 'types', 'typing', 'unicodedata', 'unittest', 'urllib', 'uu',
    'uuid', 'venv', 'warnings', 'wave', 'weakref', 'webbrowser', 'winreg', 'winsound',
    'wsgiref', 'xdrlib', 'xml', 'xmlrpc', 'zipapp', 'zipfile', 'zipimport', 'zlib',
    'zoneinfo'
}

COMMON_PKG_ALIASES = {
    'dotenv': 'python-dotenv',
    'PIL': 'pillow',
    'cv2': 'opencv-python',
    'bs4': 'beautifulsoup4',
    'yaml': 'pyyaml',
    'jwt': 'pyjwt',
    'psycopg2': 'psycopg2-binary',
    'sklearn': 'scikit-learn',
    'dateutil': 'python-dateutil',
    'jose': 'python-jose',
    'multipart': 'python-multipart',
    'magic': 'python-magic'
}

def parse_requirements(req_path):
    packages = set()
    if not os.path.exists(req_path):
        return packages
    try:
        with open(req_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or line.startswith('-'):
                    continue
                # Split by operators: ==, >=, <=, ~=, !=, >, <, ;
                pkg = re.split(r'[=<>~;]', line)[0].strip().lower().replace('-', '_')
                if pkg:
                    packages.add(pkg)
    except Exception:
        pass
    return packages

def analyze_python_project(project_dir):
    findings = []
    detected_frameworks = set()
    imported_modules = set()
    python_files = []
    
    # 1. Collect files
    for root, dirs, files in os.walk(project_dir):
        # Ignore virtualenvs, git, cache
        dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'venv', '.venv', 'env', 'node_modules', '.idea', '.vscode'}]
        for f in files:
            rel_path = os.path.relpath(os.path.join(root, f), project_dir).replace('\\', '/')
            if f.endswith('.py'):
                python_files.append((os.path.join(root, f), rel_path))

    # Parse requirements if present
    req_file = os.path.join(project_dir, 'requirements.txt')
    has_requirements = os.path.exists(req_file)
    declared_pkgs = parse_requirements(req_file) if has_requirements else set()

    if python_files and not has_requirements:
        findings.append({
            "title": "Missing requirements.txt manifest",
            "file": "root",
            "line": 1,
            "severity": "Critical",
            "category": "Dependency",
            "type": "Predicted Risk",
            "why": "No requirements.txt, Pipfile, or pyproject.toml was found for this Python project.",
            "impact": "Cloud environments (Heroku, AWS Elastic Beanstalk, Docker) will fail to install dependencies during the build step.",
            "solution": "Generate a requirements.txt with `pip freeze > requirements.txt` or declare explicit dependencies."
        })

    # 2. Analyze each python file
    for full_path, rel_path in python_files:
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
        except Exception as e:
            findings.append({
                "title": f"Cannot read source file: {os.path.basename(rel_path)}",
                "file": rel_path,
                "line": 1,
                "severity": "Medium",
                "category": "Syntax",
                "type": "Confirmed Error",
                "why": str(e),
                "impact": "File cannot be analyzed or read properly.",
                "solution": "Ensure the file is UTF-8 encoded."
            })
            continue

        # AST syntax check
        try:
            tree = ast.parse(code, filename=rel_path)
        except SyntaxError as se:
            findings.append({
                "title": f"Python Syntax Error: {se.msg}",
                "file": rel_path,
                "line": se.lineno or 1,
                "severity": "Critical",
                "category": "Syntax",
                "type": "Confirmed Error",
                "why": f"Invalid syntax encountered on line {se.lineno}: {se.text.strip() if se.text else ''}",
                "impact": "Application will crash immediately upon startup in production.",
                "solution": f"Fix the syntax error at line {se.lineno} in {rel_path}."
            })
            continue

        # AST inspection for imports and patterns
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_mod = alias.name.split('.')[0]
                    imported_modules.add((root_mod, rel_path, node.lineno))
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root_mod = node.module.split('.')[0]
                    imported_modules.add((root_mod, rel_path, node.lineno))

            # Detect frameworks
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                mod_name = getattr(node, 'module', None) or (node.names[0].name if hasattr(node, 'names') and node.names else '')
                if 'django' in mod_name:
                    detected_frameworks.add("Django")
                elif 'flask' in mod_name:
                    detected_frameworks.add("Flask")
                elif 'fastapi' in mod_name:
                    detected_frameworks.add("FastAPI")
                elif 'tornado' in mod_name:
                    detected_frameworks.add("Tornado")

            # Check for hardcoded debug = True
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        if target.id.upper() in ('DEBUG', 'APP_DEBUG'):
                            if isinstance(node.value, ast.Constant) and node.value.value is True:
                                findings.append({
                                    "title": "Debug Mode Enabled in Code",
                                    "file": rel_path,
                                    "line": node.lineno,
                                    "severity": "High",
                                    "category": "Security",
                                    "type": "Predicted Risk",
                                    "why": f"'{target.id}' is explicitly set to True in source code.",
                                    "impact": "Running with DEBUG enabled in production exposes stack traces, sensitive system variables, and potential remote execution vulnerabilities.",
                                    "solution": f"Use environment variable lookup: {target.id} = os.getenv('DEBUG', 'False').lower() == 'true'"
                                })

            # Check for hardcoded host 127.0.0.1 or localhost in app.run
            if isinstance(node, ast.Call):
                func = node.func
                # e.g., app.run(host='127.0.0.1')
                if (isinstance(func, ast.Attribute) and func.attr == 'run') or (isinstance(func, ast.Name) and func.id == 'run'):
                    for kw in node.keywords:
                        if kw.arg == 'host' and isinstance(kw.value, ast.Constant):
                            if kw.value.value in ('127.0.0.1', 'localhost'):
                                findings.append({
                                    "title": "Localhost Host Binding in Web Server",
                                    "file": rel_path,
                                    "line": node.lineno,
                                    "severity": "High",
                                    "category": "Port",
                                    "type": "Predicted Risk",
                                    "why": f"Server configured to bind to '{kw.value.value}' instead of '0.0.0.0'.",
                                    "impact": "In Docker, AWS ECS, or cloud containers, incoming container traffic will be rejected because the server only listens on loopback.",
                                    "solution": "Bind to '0.0.0.0' or read from an environment variable: host=os.getenv('HOST', '0.0.0.0')"
                                })

        # Regex checks for secrets / keys
        lines = code.splitlines()
        for idx, line in enumerate(lines, 1):
            if re.search(r'(AKIA[0-9A-Z]{16})', line):
                findings.append({
                    "title": "Hardcoded AWS Access Key Detected",
                    "file": rel_path,
                    "line": idx,
                    "severity": "Critical",
                    "category": "Security",
                    "type": "Confirmed Error",
                    "why": "Found hardcoded AWS access key ID pattern.",
                    "impact": "Exposing cloud credentials in source repositories or deployment bundles can lead to account takeover and immense financial or data loss.",
                    "solution": "Remove the hardcoded key immediately, rotate it in the AWS console, and use AWS IAM roles or environment variables (AWS_ACCESS_KEY_ID)."
                })
            if re.search(r'(?:jwt_secret|secret_key|api_key|password)\s*=\s*["\'][a-zA-Z0-9_\-\.\@\#\$\%\^\&\*]{8,}["\']', line, re.I):
                findings.append({
                    "title": "Hardcoded Secret / Password Detected",
                    "file": rel_path,
                    "line": idx,
                    "severity": "High",
                    "category": "Security",
                    "type": "Predicted Risk",
                    "why": "A sensitive secret token or password appears hardcoded.",
                    "impact": "Leaks sensitive credentials across deployment artifacts.",
                    "solution": "Store secrets in an external `.env` file or cloud secrets manager (e.g. AWS Secrets Manager)."
                })

    # 3. Check for undeclared dependencies
    if has_requirements:
        local_py_names = {os.path.splitext(os.path.basename(p[0]))[0] for p in python_files}
        local_dirs = {os.path.basename(r) for r, _, _ in os.walk(project_dir)}
        
        reported_missing = set()
        for mod, rel_path, lineno in imported_modules:
            if mod in STDLIB_MODULES or mod in local_py_names or mod in local_dirs:
                continue
            canonical_pkg = COMMON_PKG_ALIASES.get(mod, mod).lower().replace('-', '_')
            if canonical_pkg not in declared_pkgs and canonical_pkg not in reported_missing:
                reported_missing.add(canonical_pkg)
                findings.append({
                    "title": f"Undeclared Dependency: '{mod}'",
                    "file": rel_path,
                    "line": lineno,
                    "severity": "Critical",
                    "category": "Dependency",
                    "type": "Confirmed Error",
                    "why": f"Module '{mod}' is imported in '{rel_path}' but missing from requirements.txt.",
                    "impact": "Production deployment build will fail with 'ModuleNotFoundError: No module named {mod}'.",
                    "solution": f"Add '{COMMON_PKG_ALIASES.get(mod, mod)}' to your requirements.txt."
                })

    return {
        "frameworks": list(detected_frameworks),
        "pythonFilesCount": len(python_files),
        "findings": findings
    }

if __name__ == '__main__':
    target_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    result = analyze_python_project(os.path.abspath(target_dir))
    print(json.dumps(result, indent=2))
