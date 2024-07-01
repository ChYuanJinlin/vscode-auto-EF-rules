/*
 * @Author: 袁金林 yuanjinlin@guishangyi.cn
 * @Date: 2024-06-26 11:36:45
 * @LastEditors: 袁金林 yuanjinlin@guishangyi.cn
 * @LastEditTime: 2024-06-28 15:32:24
 * @FilePath: \element-rules\src\extension.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import { getEditorText } from "./rules";
const prettier = require("prettier");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  const disposable = vscode.commands.registerCommand(
    "auto-EF-rules.autoEFRules",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // 获取当前活动编辑器
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const filePath = editor.document.uri.fsPath; // 获取文件路径
        const fileName = path.basename(filePath); // 获取文件名
        const fileExtension = path.extname(fileName).toLowerCase(); // 获取后缀名（小写）
        // 获取光标的位置（选择范围）
        const position = editor.selection.active;
        // 获取当前文档内容
        const document = editor.document;
        const content = document.getText();
        if (fileExtension !== ".vue") {
          vscode.window.showErrorMessage(`当前不是 vue 文件`);
          return;
        }
        try {
          const rules = `\nrules:${await prettier.format(
            JSON.stringify(getEditorText(content)),
            {
              semi: false,
              parser: "json5",
            }
          )},`;

          // 插入代码
          await editor.edit((editBuilder) => {
            editBuilder.insert(position, rules);
          });
          // 通知用户操作已完成
          vscode.window.showInformationMessage("rules 对象已生成");
        } catch (error) {
          console.log("🚀 ~ error:", error);
        }
      } else {
        vscode.window.showInformationMessage("没有打开的活动文本编辑器");
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
