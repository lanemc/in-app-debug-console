from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="in-app-debug-console",
    version="1.0.0",
    author="Smart Console Debugger Team",
    author_email="team@smart-console-debugger.com",
    description="A secure, built-in mini REPL console for web applications",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/smart-console-debugger/in-app-debug-console",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Framework :: Flask",
        "Topic :: Software Development :: Debuggers",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "Flask>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=6.0",
            "pytest-flask>=1.2.0",
            "black>=22.0",
            "flake8>=4.0",
        ],
    },
    include_package_data=True,
    package_data={
        "in_app_debug_console": ["ui/*"],
    },
)