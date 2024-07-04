/*
 * @Author: 袁金林 yuanjinlin@guishangyi.cn
 * @Date: 2024-06-26 14:32:10
 * @LastEditors: 袁金林 yuanjinlin@guishangyi.cn
 * @LastEditTime: 2024-07-04 11:14:45
 * @FilePath: \element-rules\element-rules\src\rules.ts
 * @Description:
 *
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved.
 */
const compiler = require("vue-template-compiler");
import * as vscode from "vscode";
// 读取扩展设置
const myExtensionConfig = vscode.workspace.getConfiguration("auto-EF-rules");
type rulesElement = {
  elements: string[];
  trigger: string;
};
interface IRulesConfig {
  input: rulesElement;
  select: rulesElement;
  upload: rulesElement;
}
interface IElements {
  attrsMap?: {
    rules: any;
    label: string;
    prop: any;
    placeholder: string;
  };
  tag: any;
  children: IElements[];
}
const triggers = myExtensionConfig.get<string>("triggers");
const inputElements = myExtensionConfig.get<rulesElement>("inputElements");
const selectElements = myExtensionConfig.get<rulesElement>("selectElements");
const uploadElements = myExtensionConfig.get<rulesElement>("uploadElements");
let rules: { key: string; value: any }[] = [];
let obj: any = {};
export function getEditorText(tem: string) {
  rules = [];
  tem = tem.replace(
    /[`${|}`]|v-if="[^"]*"|v-else-if="[^"]*"|v-else="[^"]*"|:/g,
    ""
  );
  const ast = compiler.compile(tem);
  if (inputElements && selectElements && uploadElements) {
    const rulesConfig: IRulesConfig = {
      // 输入框标签
      input: inputElements,
      //    选择器标签
      select: selectElements,
      // 上传标签
      upload: uploadElements,
    };

    function genRules(el: IElements[]) {
      if(!el) {
        return 
      }
      el.forEach((item: IElements) => {
        if (item.tag === "el-form" && item.attrsMap?.rules) {
          obj = {};
          rules.push({
            key: item.attrsMap?.rules,
            value: createRules(item, item),
          });
          return;
        }
        genRules(item.children);
      });
    }

    genRules(ast.ast.children);

    function createRules(element: IElements, parent: IElements) {
      element.children?.forEach((item) => {
        if (
          item.tag == "el-form-item" &&
          item.attrsMap?.prop &&
          !item.attrsMap?.rules
        ) {
          item.children.forEach((el) => {
            if (
              [
                ...rulesConfig.input.elements,
                ...rulesConfig.select.elements,
                ...rulesConfig.upload.elements,
              ].includes(el.tag)
            ) {
              if (rulesConfig.input.elements.includes(el.tag)) {
                obj[item.attrsMap?.prop] = [
                  {
                    required: true,
                    message: item.attrsMap?.label
                      ? "请输入" + item.attrsMap?.label
                      : el.attrsMap?.placeholder,
                    trigger: rulesConfig.input.trigger || triggers,
                  },
                ];
              } else if (rulesConfig.select.elements.includes(el.tag)) {
                obj[item.attrsMap?.prop] = [
                  {
                    required: true,
                    message: item.attrsMap?.label
                      ? "请选择" + item.attrsMap?.label
                      : el.attrsMap?.placeholder,
                    trigger: rulesConfig.select.trigger || triggers,
                  },
                ];
              } else if (rulesConfig.upload.elements.includes(el.tag)) {
                obj[item.attrsMap?.prop] = [
                  {
                    required: true,
                    message: item.attrsMap?.label
                      ? "请上传" + item.attrsMap?.label
                      : el.attrsMap?.placeholder,
                    trigger: rulesConfig.upload.trigger || triggers,
                  },
                ];
              }
            }
          });
        }
        createRules(item, parent);
      });

      return obj;
    }
  }

  return rules;
}
