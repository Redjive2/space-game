let errs = ''
function parseError(text) {
    errs += '\n| ' + text
}

function commitErrors() {
    if (errs !== '') {
        throw errs
    }
}

function banKeywords(tree, Walk) {
    Walk.simple(tree, {
        DoWhileStatement(node) {
            parseError(`Use of 'do/while' is not allowed.`);
        },
        UnaryExpression(node) {
            if (node.operator === 'void') {
                parseError("Use of 'void' is not allowed.");
            } else if (node.operator === 'delete') {
                parseError("Use of 'delete' is not allowed.");
            } else if (node.operator === '+') {
                parseError("Use of unary '+' is not allowed.");
            } else if (node.operator === '~') {
                parseError("Use of unary '~' is not allowed.");
            }
        },
        WithStatement() {
            parseError("Use of 'with' is not allowed.");
        },
        FunctionDeclaration(node) {
            if (node.generator) {
                parseError("Use of 'function*' is not allowed.");
            }
        },
        YieldExpression() {
            parseError("Use of 'yield' is not allowed.");
        },
        BinaryExpression(node) {
            if (node.operator === 'instanceof') {
                parseError("Use of 'instanceof' is not allowed.");
            }
        },
        SwitchStatement() {
            parseError("Use of 'switch' is not allowed.");
        },
        SwitchCase() {
            parseError("Use of 'case' is not allowed.");
        },
        ContinueStatement() {
            parseError("Use of 'continue' is not allowed.");
        },
        ThrowStatement() {
            parseError("Use of 'throw' is not allowed, use 'error(err)' or 'raise(err)' instead.");
        },
        TryStatement(node) {
            if (node.finalizer) {
                parseError("Use of 'finally' is not allowed.");
            }
        },
        ForOfStatement() {
            parseError("Use of 'for...of' is not allowed, use 'for (const name in iterable)' for the same effect.");
        },
        StaticBlock() {
            parseError("Use of 'static' is not allowed.");
        },
        ConditionalExpression() {
            parseError("Use of ternary operator is not allowed.");
        },
        ForInStatement(node) {
            if (node.left.kind !== 'const') {
                parseError("Use of 'for (var ...)' or 'for (let ...)' is not allowed.");
            }
        }
    });
}

function banAssignmentOperators(tree, Walk) {
    Walk.simple(tree, {
        AssignmentExpression(node) {
            if ('+= -= *= /= %= **= <<= >>= >>>= &= ^= |= &&= ||= ??='.split(' ').includes(node.operator)) {
                parseError(`Use of '${node.operator}' is not allowed, use 'lhs = lhs ${node.operator.slice(0, -1)} rhs' instead.`);
            }
        }
    });
}

function replaceOperatorsAndKeywords(tree, Walk, replacements, result) {
    Walk.simple(tree, {
        BinaryExpression(node) {
            if (node.operator === '==') {
                replacements.push({ start: node.left.end, end: node.right.start, replacement: ' === ' });
            } else if (node.operator === '!=') {
                replacements.push({ start: node.left.end, end: node.right.start, replacement: ' !== ' });
            } else if (node.operator === '===') {
                parseError("Use of '===' is not allowed, use '==' instead.");
            } else if (node.operator === '&') {
                replacements.push({ start: node.left.end, end: node.right.start, replacement: ' && ' });
            } else if (node.operator === '|') {
                replacements.push({ start: node.left.end, end: node.right.start, replacement: ' || ' });
            } else if (node.operator === '&&') {
                parseError("Use of '&&' is not allowed, use '&' instead.");
            } else if (node.operator === '||') {
                parseError("Use of '||' is not allowed, use '|' instead.");
            }
        },
        VariableDeclaration(node) {
            if (node.kind === 'var') {
                replacements.push({ start: node.start, end: node.start + 3, replacement: 'let' });
            } else if (node.kind === 'let') {
                parseError("Use of 'let' is not allowed, use 'var' instead.");
            } else if (node.kind === 'const') {
                node.declarations.forEach(declaration => {
                    if (declaration.init) {
                        const start = declaration.init.start;
                        const end = declaration.init.end;
                        replacements.push({
                            start,
                            end,
                            replacement: `window.__CONSTANT__(${result.slice(start, end)})`
                        });
                    }
                });
            }
        },
        ForInStatement(node) {
            const lhs = result.slice(node.left.start, node.left.end);
            const rhs = result.slice(node.right.start, node.right.end);
            replacements.push({
                start: node.start,
                end: node.right.end + 1,
                replacement: `for (${lhs} of ${rhs})`
            });
        }
    });
}

export function translate(file, Acorn, Walk) {
    let result = file.text;
    const tree = Acorn.parse(file.text, { ecmaVersion: 2020 });

    // Ban specific keywords and assignment operators
    banKeywords(tree, Walk);
    banAssignmentOperators(tree, Walk);

    // List of replacements to apply
    const replacements = [];

    // Walk through the AST and collect replacements
    replaceOperatorsAndKeywords(tree, Walk, replacements, result);

    // Sort replacements in reverse order to avoid messing up indices
    replacements.sort((a, b) => b.start - a.start);

    // Apply replacements
    for (const { start, end, replacement } of replacements) {
        result = result.slice(0, start) + replacement + result.slice(end);
    }

    commitErrors();
    return { ...file, text: result };
}

function unrollIterator(iter) {
    let list = [];

    for (const val of iter) {
        list.push(val);
    }

    return list;
}

export function __CONSTANT__(expr) {
    if (expr === null) {
        return null
        return null
    }

    if (expr instanceof Node) {
        return Object.freeze(expr);
    } else if (typeof expr === 'object') {
        return new Proxy(Object.freeze(expr), {
            set(...args) {
                throw 'cannot set constant value';
            }
        });
    }

    return expr;
}



export const Bits = Object.freeze({
    and: (a, b) => a & b,
    or: (a, b) => a | b,
    not: (a) => ~a,
    shr: (a, b) => a >> b,
    shl: (a, b) => a << b
})

export function raise(err) {
    throw new Error(err)
}
