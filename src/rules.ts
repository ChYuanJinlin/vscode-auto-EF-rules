/*
 * @Author: 袁金林 yuanjinlin@guishangyi.cn
 * @Date: 2024-06-26 14:32:10
 * @LastEditors: 袁金林 yuanjinlin@guishangyi.cn
 * @LastEditTime: 2024-06-28 11:58:11
 * @FilePath: \element-rules\src\rules.ts
 * @Description:
 *
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved.
 */
const compiler = require('vue-template-compiler')
import * as vscode from 'vscode'
// 读取扩展设置
const myExtensionConfig = vscode.workspace.getConfiguration(
    'auto-EF-rules'
)
type rulesElement = {
    elements: string[]
    trigger: string
}
interface IRulesConfig {
    input: rulesElement
    select: rulesElement
    upload: rulesElement
}
const triggers = myExtensionConfig.get<string>('triggers')
const inputElements = myExtensionConfig.get<rulesElement>('inputElements')
const selectElements = myExtensionConfig.get<rulesElement>('selectElements')
const uploadElements = myExtensionConfig.get<rulesElement>('uploadElements')

if (triggers) {
    inputElements!.trigger = triggers
    selectElements!.trigger = triggers
    uploadElements!.trigger = triggers
}

export function getEditorText(tem: string) {
    tem = tem.replace(
        /[`${|}`]|v-if="[^"]*"|v-else-if="[^"]*"|v-else="[^"]*"|:/g,
        ''
    )
    const ast = compiler.compile(tem)
    if (inputElements && selectElements && uploadElements) {
        const rulesConfig: IRulesConfig = {
            // 输入框标签
            input: inputElements,
            //    选择器标签
            select: selectElements,
            // 上传标签
            upload: uploadElements,
        }

        const rules: any = {}
        function genRules(el: { children: any[] }) {
            el.children.forEach(
                (element: {
                    attrsMap: { label: string; prop: any }
                    tag: string
                    children: any
                }) => {
                    if (element.attrsMap && element.tag == 'el-form-item') {
                        if (element.attrsMap.label && element.attrsMap.prop) {
                            element.attrsMap.label =
                                element.attrsMap.label.replace(/[\s\r\n]/g, '')
                            createRules(element, element)
                        }
                    } else {
                        if (element.children) {
                            genRules(element)
                        }
                    }
                }
            )
        }

        function createRules(
            element: { children: any[] },
            parent: { attrsMap: { prop: string | number; label: string } }
        ) {
            if (element.children) {
                element.children.forEach(
                    (item: { tag: string; children: any[] }) => {
                        if (
                            [
                                ...rulesConfig.input.elements,
                                ...rulesConfig.select.elements,
                                ...rulesConfig.upload.elements,
                            ].includes(item.tag)
                        ) {
                            if (rulesConfig.input.elements.includes(item.tag)) {
                                rules[parent.attrsMap.prop] = [
                                    {
                                        required: true,
                                        message:
                                            '请输入' + parent.attrsMap.label,
                                        trigger: rulesConfig.input.trigger,
                                    },
                                ]
                            } else if (
                                rulesConfig.select.elements.includes(item.tag)
                            ) {
                                rules[parent.attrsMap.prop] = [
                                    {
                                        required: true,
                                        message:
                                            '请选择' +
                                            parent.attrsMap.label.trim(),
                                        trigger: rulesConfig.select.trigger,
                                    },
                                ]
                            } else if (
                                rulesConfig.upload.elements.includes(item.tag)
                            ) {
                                rules[parent.attrsMap.prop] = [
                                    {
                                        required: true,
                                        message:
                                            '请上传' + parent.attrsMap.label,
                                        trigger: rulesConfig.upload.trigger,
                                    },
                                ]
                            }
                        } else {
                            createRules(item, parent)
                        }
                    }
                )
            }
        }

        genRules(ast.ast)

        return rules
    }
}
