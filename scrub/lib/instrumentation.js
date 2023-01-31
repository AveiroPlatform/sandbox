/*!
 * Copyright(c) Eros 2017 <pbft@foxmail.com>
 */

/**
 * Module dependencies.
 */

const assert = require('assert')
const esprima = require('esprima')
const escodegen = require('escodegen')

var _gasDeclaration

const _emptyBlockStr = `{"type":"BlockStatement","body":[]}`

function genBr(decLength) {
  const templateGen = `{"type":"IfStatement","test":{"type":"Literal","value":true,"raw":"true"},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"${_gasDeclaration}"},"right":{"type":"BinaryExpression","operator": "-","left": {"type": "Identifier","name": "${_gasDeclaration}"},"right": {"type": "Literal","value": ${decLength},"raw": "${decLength}"}}}},{"type": "IfStatement","test": {"type": "BinaryExpression","operator": "<=","left": {"type": "Identifier","name": "${_gasDeclaration}"},"right": {"type": "Literal","value": 0,"raw": "0"}},"consequent": {"type": "BlockStatement","body": [{"type": "ThrowStatement","argument": {"type": "NewExpression","callee": {"type": "Identifier","name": "Error"},"arguments": [{"type": "Literal","value":"gas-has-been-exhausted","raw":"'gas-has-been-exhausted'"}]}}]},"alternate":null}]},"alternate":null}`
  return JSON.parse(templateGen)
}

function parseProgram(ast) {
  assert(ast.type === 'Program')
  const body = ast.body
  const labeledStatement = body[1]
  assert(labeledStatement.type === 'LabeledStatement')
  const doWhileStatement = labeledStatement.body
  assert(doWhileStatement.type === 'DoWhileStatement')
  const doWhileBlock = doWhileStatement.body
  for (let i = 1; i < doWhileBlock.body.length; ++i) {
    parse(doWhileBlock.body[i])
  }

}

function parse (node) {
  if (!node || typeof node !== 'object') {
    return
  }
  if (!(Object.hasOwn(node, 'type') && !node.__skip)) {
    return
  }

  node.__skip = true

  switch (node.type) {
    case 'Program': {
      throw new Error('Unexpected Program')
    }
    case 'BlockStatement': {
      const length = node.body.length
      const expend = length > 0 ? (length / 2 + 0.5) : 0.5
      const genAst = genBr(expend)
      node.body.unshift(genAst)
      for (let i = 1; i < node.body.length; ++i) {
        parse(node.body[i])
      }
    }
      break;
    case 'ExpressionStatement': {
      parse(node.expression)
    }
      break;
    case 'ClassBody': {
      const body = node.body
      for (const i of body) {
        parse(i)
      }
    }
      break;
    case 'MethodDefinition': {
      parse(node.key)
      parse(node.value)
    }
      break;
    case 'IfStatement': {
      parse(node.test)
      const consequent = node.consequent
      if (consequent.type === 'BlockStatement') {
        parse(consequent)
      } else if (consequent.type === 'EmptyStatement') {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        node.consequent = emptyBlock
      } else {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        emptyBlock.body.push(consequent)
        node.consequent = emptyBlock
        parse(node.consequent.body[1])
      }
      if (node.alternate) {
        if (node.alternate.type === 'BlockStatement') {
          parse(node.alternate)
        } else if (node.alternate.type === 'EmptyStatement') {
          const length = 1
          const emptyBlock = JSON.parse(_emptyBlockStr)
          const expend = length > 0 ? (length / 2 + 0.5) : 0.5
          const genAst = genBr(expend)
          emptyBlock.body.push(genAst)
          node.alternate = emptyBlock
        } else {
          const length = 1
          const emptyBlock = JSON.parse(_emptyBlockStr)
          const expend = length > 0 ? (length / 2 + 0.5) : 0.5
          const genAst = genBr(expend)
          emptyBlock.body.push(genAst)
          emptyBlock.body.push(node.alternate)
          node.alternate = emptyBlock
          parse(emptyBlock.body[1])
        }
      }
    }
      break;
    case 'LabeledStatement': {
      parse(node.label)
      parse(node.body)
    }
      break;
    case 'WithStatement': {
      throw new Error('Unexpected token with')
    }
    case 'SwitchStatement': {
      parse(node.discriminant)
      const cases = node.cases
      for (const it of cases) {
        parse(it)
      }
    }
      break;
    case 'ReturnStatement': {
      const _argument = node.argument
      parse(_argument)
    }
      break;
    case 'ThrowStatement': {
      const _argument = node.argument
      parse(_argument)
    }
      break;
    case 'TryStatement': {
      parse(node.block)
      parse(node.handler)
      parse(node.finalizer)
    }
      break;
    case 'WhileStatement': {
      parse(node.test)
      const body = node.body
      if (body.type === 'BlockStatement') {
        parse(body)
      } else if (body.type === 'EmptyStatement') {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        node.body = emptyBlock
      } else {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        emptyBlock.body.push(body)
        node.body = emptyBlock
        parse(emptyBlock.body[1])
      }
    }
      break;
    case 'DoWhileStatement': {
      parse(node.test)
      const body = node.body
      if (body.type === 'BlockStatement') {
        parse(body)
      } else if (body.type === 'EmptyStatement') {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        node.body = emptyBlock
      } else {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        emptyBlock.body.push(body)
        node.body = emptyBlock
        parse(emptyBlock.body[1])
      }
    }
      break;
    case 'ForStatement': {
      parse(node.init)
      parse(node.test)
      parse(node.update)
      const body = node.body
      if (body.type === 'BlockStatement') {
        parse(body)
      } else if (body.type === 'EmptyStatement') {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        node.body = emptyBlock
      } else {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        emptyBlock.body.push(body)
        node.body = emptyBlock
        parse(emptyBlock.body[1])
      }
    }
      break;
    case 'ForInStatement': {
      parse(node.left)
      parse(node.right)
      const body = node.body
      if (body.type === 'BlockStatement') {
        parse(body)
      } else if (body.type === 'EmptyStatement') {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        node.body = emptyBlock
      } else {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        emptyBlock.body.push(body)
        node.body = emptyBlock
        parse(emptyBlock.body[1])
      }
    }
      break;
    case 'ForOfStatement': {
      parse(node.left)
      parse(node.right)
      const body = node.body
      if (body.type === 'BlockStatement') {
        parse(body)
      } else if (body.type === 'EmptyStatement') {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        node.body = emptyBlock
      } else {
        const length = 1
        const emptyBlock = JSON.parse(_emptyBlockStr)
        const expend = length > 0 ? (length / 2 + 0.5) : 0.5
        const genAst = genBr(expend)
        emptyBlock.body.push(genAst)
        emptyBlock.body.push(body)
        node.body = emptyBlock
        parse(emptyBlock.body[1])
      }
    }
      break;
    case 'DebuggerStatement': {
      throw new Error('Unexpected token debugger')
    }
    case 'FunctionDeclaration': {
      if (node.async) {
        throw new Error('Unexpected token async')
      }
      if (node.generator) {
        throw new Error('Unexpected token function *')
      }
      parse(node.body)
    }
      break;
    case 'VariableDeclaration': {
      const declarations = node.declarations
      for (const i of declarations) {
        parse(i)
      }
    }
      break;
    case 'VariableDeclarator': {
      parse(node.id)
      parse(node.init)
    }
      break;
    case 'ClassDeclaration': {
      const superClass = node.superClass
      const body = node.body
      parse(node.id)
      parse(superClass)
      parse(body)
    }
      break;
    case 'ArrayExpression': {
      const elements = node.elements
      for (const i of elements) {
        parse(i)
      }
    }
      break;
    case 'ObjectExpression': {
      const properties = node.properties
      for (const i of properties) {
        parse(i)
      }
    }
      break;
    case 'ClassExpression': {
      const superClass = node.superClass
      const body = node.body
      parse(node.id)
      parse(superClass)
      parse(body)
    }
      break;
    case 'Property': {
      parse(node.key)
      parse(node.value)
    }
      break;
    case 'FunctionExpression': {
      if (node.async) {
        throw new Error('Unexpected token async')
      }
      if (node.generator) {
        throw new Error('Unexpected token function *')
      }
      const body = node.body
      if (body.type === 'BlockStatement') {
        parse(body)
      } else {
        throw new Error('Unexpected function statement')
      }
    }
      break;
    case 'ArrowFunctionExpression': {
      if (node.async) {
        throw new Error('Unexpected token async')
      }
      if (node.generator) {
        throw new Error('Unexpected token function *')
      }
      parse(node.body)
    }
      break;
    case 'BinaryExpression': {
      parse(node.left)
      parse(node.right)
    }
      break;
    case 'SequenceExpression': {
      for (const i of node.expressions) {
        parse(i)
      }
    }
      break;
    case 'UnaryExpression': {
      parse(node.argument)
    }
      break;
    case 'AssignmentExpression': {
      parse(node.left)
      parse(node.right)
    }
      break;
    case 'LogicalExpression': {
      parse(node.left)
      parse(node.right)
    }
      break;
    case 'ConditionalExpression': {
      parse(node.test)
      parse(node.consequent)
      parse(node.alternate)
    }
      break;
    case 'NewExpression': {
      const r = redundancyNew(node)
      if (r) {
        parse(node.callee)
        for (const i of node.arguments) {
          parse(i)
        }
      }
    }
      break;
    case 'CallExpression': {
      const r = redundancyCall(node)
      if (r) {
        parse(node.callee)
        for (const i of node.arguments) {
          parse(i)
        }
      }
    }
      break;
    case 'MemberExpression': {
      parse(node.object)
      parse(node.property)
    }
      break;
    case 'YieldExpression': {
      throw new Error('Unexpected token yield')
    }
    case 'GraphExpression': {
      throw new Error('Unexpected token #')
    }
    case 'AwaitExpression': {
      throw new Error('Unexpected token await')
    }
    case 'ObjectPattern': {
      const properties = node.properties
      for (const i of properties) {
        parse(i)
      }
    }
      break;
    case 'ArrayPattern': {
      const elements = node.elements
      for (const i of elements) {
        parse(i)
      }
    }
      break;
    case 'SwitchCase': {
      parse(node.test)
      const length = node.consequent.length
      const expend = length > 0 ? (length / 2 + 0.5) : 0.5
      const genAst = genBr(expend)
      node.consequent.unshift(genAst)
      for (let i = 1; i < node.consequent.length; ++i) {
        parse(node.consequent[i])
      }
    }
      break;
    case 'CatchClause': {
      parse(node.body)
    }
      break;
    case 'TemplateLiteral': {
      const expressions = node.expressions
      for (const i of expressions) {
        parse(i)
      }
    }
      break;
    case 'Identifier': {
      if (node.name === 'Function') {
        throw new Error('Unexpected token Function')
      }
      if (node.name === 'eval') {
        throw new Error('Unexpected token eval')
      }
    }
      break;
    default:
      break;
  }
}

function redundancyNew(node) {
  let toDo = true
  const _arguments = node.arguments
  const callee = node.callee
  if (callee.type === 'Identifier' && callee.name === 'Promise') {
    throw new Error('Unexpected token Promise')
  }
  if (callee.type === 'Identifier' && callee.name === 'Function') {
    toDo = false
    if (!(_arguments.length === 1)) {
      throw new Error('Unexpected token Function')
    }
    if (!(_arguments[0].type === 'Literal' && _arguments[0].value === 'return this')) {
      throw new Error('Unexpected token Function')
    }
  } else if (callee.type === 'SequenceExpression') {
    const expressions = callee.expressions
    if (expressions.length > 0) {
      if (expressions[expressions.length - 1].type === 'Identifier' &&
        expressions[expressions.length - 1].name === 'Function') {
        if (!(_arguments.length === 1)) {
          throw new Error('Unexpected token Function')
        }
        if (!(_arguments[0].type === 'Literal' && _arguments[0].value === 'return this')) {
          throw new Error('Unexpected token Function')
        }
        expressions[expressions.length - 1].__skip = true
      }
    }
  }
  return toDo
}

function redundancyCall(node) {
  let toDo = true
  const callee = node.callee
  const _arguments = node.arguments
  if (callee.type === 'Identifier' && callee.name === 'Function') {
    toDo = false
    if (!(_arguments.length === 1)) {
      throw new Error('Unexpected token Function')
    }
    if (!(_arguments[0].type === 'Literal' && _arguments[0].value === 'return this')) {
      throw new Error('Unexpected token Function')
    }
  } else if (callee.type === 'Identifier' && callee.name === 'eval') {
    toDo = false
    if (!(_arguments.length === 1)) {
      throw new Error('Unexpected token eval')
    }
    if (!(_arguments[0].type === 'Literal' && _arguments[0].value === 'this')) {
      throw new Error('Unexpected token eval')
    }
  } else if (callee.type === 'SequenceExpression') {
    const expressions = callee.expressions
    if (expressions.length > 0) {
      if (expressions[expressions.length - 1].type === 'Identifier' &&
        expressions[expressions.length - 1].name === 'Function') {
        if (!(_arguments.length === 1)) {
          throw new Error('Unexpected token Function')
        }
        if (!(_arguments[0].type === 'Literal' && _arguments[0].value === 'return this')) {
          throw new Error('Unexpected token Function')
        }
        expressions[expressions.length - 1].__skip = true
      } else if (expressions[expressions.length - 1].type === 'Identifier' &&
        expressions[expressions.length - 1].name === 'eval') {
        if (!(_arguments.length === 1)) {
          throw new Error('Unexpected token eval')
        }
        if (!(_arguments[0].type === 'Literal' && _arguments[0].value === 'this')) {
          throw new Error('Unexpected token eval')
        }
        expressions[expressions.length - 1].__skip = true
      }
    }
  }
  return toDo
}

module.exports = function (source, gasDeclaration) {
  _gasDeclaration = gasDeclaration
  const astTree = esprima.parseScript(source, undefined)
  parseProgram(astTree)
  return escodegen.generate(astTree, {
    format: { indent: { style: '  ' } }
  })
}
