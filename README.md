# clean-node

A CLI tool to scan and list all `node_modules` directories starting from the current working directory. It shows the full path, last modification date, and total size of each directory — ideal for identifying and cleaning up unused dependencies.

---

## 🚀 Installation

Clone the repository and link it locally:

```bash
npm install
npm link
```

This will make the clean-node command available globally in your terminal.

## 🧼 How to use

```bash
clean-node
```

## 📦 Example output

```bash
📦 [1] /Users/user/Projects/api/node_modules
   🕒 Last modified: 04/04/2025 12:32:10

📦 [2] /Users/user/Projects/site/node_modules
   🕒 Last modified: 03/04/2025 09:10:47
```

## 🔧 Requirements

Node.js 18 or newer

## 📌 Notes

This tool does not delete any folders — it only scans and reports.

Made because I'm tired of forgotten node_modules eating up disk space. 

* Possible in future I'll add delete feature.
