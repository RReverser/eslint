/**
 * @fileoverview Disallow parenthesesisng higher precedence subexpressions.
 * @author Michael Ficarra
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    /**
     * Determines if a node is surrounded by parentheses.
     * @param {ASTNode} node The node to check.
     * @returns {boolean} True if surrounded by parens, false if not.
     * @private
     */
    function isParenthesised(node) {
        var previousToken = context.getTokenBefore(node),
            nextToken = context.getTokenAfter(node);

        return previousToken && nextToken &&
            previousToken.value === "(" && previousToken.range[1] <= node.range[0] &&
            nextToken.value === ")" && nextToken.range[0] >= node.range[1];
    }

    /**
     * Determines if a node is surrounded by two sets of parentheses.
     * @param {ASTNode} node The node to check.
     * @returns {boolean} True if surrounded by two sets of parens, false if not.
     * @private
     */
    function isParenthesisedTwice(node) {
        var previousToken = context.getTokenBefore(node, 1),
            nextToken = context.getTokenAfter(node, 1);

        return isParenthesised(node) && previousToken && nextToken &&
            previousToken.value === "(" && previousToken.range[1] <= node.range[0] &&
            nextToken.value === ")" && nextToken.range[0] >= node.range[1];
    }

    /**
     * Determines the order of operation for the given node.
     * @param {ASTNode} node The node to check.
     * @returns {int} The operation precendence.
     * @private
     */
    function precedence(node) {

        switch(node.type) {
            case "SequenceExpression":
                return 0;

            case "AssignmentExpression":
                return 1;

            case "ConditionalExpression":
                return 3;

            case "LogicalExpression":
                switch(node.operator) {
                    case "||":
                        return 4;
                    case "&&":
                        return 5;
                }

                /* falls through */
            case "BinaryExpression":
                switch(node.operator) {
                    case "|":
                        return 6;
                    case "^":
                        return 7;
                    case "&":
                        return 8;
                    case "==":
                    case "!=":
                    case "===":
                    case "!==":
                        return 9;
                    case "<":
                    case "<=":
                    case ">":
                    case ">=":
                    case "in":
                    case "instanceof":
                        return 10;
                    case "<<":
                    case ">>":
                    case ">>>":
                        return 11;
                    case "+":
                    case "-":
                        return 12;
                    case "*":
                    case "/":
                    case "%":
                        return 13;
                }
                /* falls through */
            case "UnaryExpression":
                return 14;
            case "UpdateExpression":
                return 15;
            case "CallExpression":
                return 16;
            case "NewExpression":
                return 17;
        }
        return 18;
    }

    /**
     * Reports a warning.
     * @param {ASTNode} node The node that caused the warning.
     * @returns {void}
     * @private
     */
    function report(node) {
        context.report(node, "Extra parentheses around expression.");
    }

    /**
     * Determines if a given node represents an IIFE.
     * @param {ASTNode} node The node to check.
     * @returns {boolean} True if it's an IIFE, false if not.
     * @private
     */
    function isIIFE(node) {
        return node.type === "CallExpression" && node.callee.type === "FunctionExpression";
    }

    function dryUnaryUpdate(node) {
        if (isParenthesised(node.argument) && precedence(node.argument) >= precedence(node)) {
            report(node.argument);
        }
    }

    function dryCallNew(node) {
        if (isParenthesised(node.callee) && precedence(node.callee) >= precedence(node)) {
            report(node.callee);
        }
        if (node.arguments.length === 1) {
            if (isParenthesisedTwice(node.arguments[0]) && precedence(node.arguments[0]) >= precedence({type: "AssignmentExpression"})) {
                report(node.arguments[0]);
            }
        } else {
            node.arguments.forEach(function(arg){
                if (isParenthesised(arg) && precedence(arg) >= precedence({type: "AssignmentExpression"})) {
                    report(arg);
                }
            });
        }
    }

    function dryBinaryLogical(node) {
        var prec = precedence(node);
        if (isParenthesised(node.left) && precedence(node.left) >= prec) {
            report(node.left);
        }
        if (isParenthesised(node.right) && precedence(node.right) > prec) {
            report(node.right);
        }
    }

    return {
        "ArrayExpression": function(node) {
            [].forEach.call(node.elements, function(e) {
                if (e && isParenthesised(e) && precedence(e) >= precedence({type: "AssignmentExpression"})) {
                    report(e);
                }
            });
        },
        "AssignmentExpression": function(node) {
            if (isParenthesised(node.right) && precedence(node.right) >= precedence(node)) {
                report(node.right);
            }
        },
        "BinaryExpression": dryBinaryLogical,
        "CallExpression": dryCallNew,
        "ConditionalExpression": function(node) {
            if (isParenthesised(node.test) && precedence(node.test) >= precedence({type: "LogicalExpression", operator: "||"})) {
                report(node.test);
            }
            if (isParenthesised(node.consequent) && precedence(node.consequent) >= precedence({type: "AssignmentExpression"})) {
                report(node.consequent);
            }
            if (isParenthesised(node.alternate) && precedence(node.alternate) >= precedence({type: "AssignmentExpression"})) {
                report(node.alternate);
            }
        },
        "DoWhileStatement": function(node) {
            if (isParenthesisedTwice(node.test)) { report(node.test); }
        },
        "ExpressionStatement": function(node) {
            var firstToken;
            if (isParenthesised(node.expression)) {
                firstToken = context.getFirstToken(node.expression);
                if (firstToken.value !== "function" && firstToken.value !== "{") {
                    report(node.expression);
                }
            }
        },
        "ForInStatement": function(node) {
            if (isParenthesised(node.right)) {
                report(node.right);
            }
        },
        "ForStatement": function(node) {
            if (node.init && isParenthesised(node.init)) {
                report(node.init);
            }
            if (node.test && isParenthesised(node.test)) {
                report(node.test);
            }
            if (node.update && isParenthesised(node.update)) {
                report(node.update);
            }
        },
        "IfStatement": function(node) {
            if (isParenthesisedTwice(node.test)) {
                report(node.test);
            }
        },
        "LogicalExpression": dryBinaryLogical,
        "MemberExpression": function(node) {
            if (
                isParenthesised(node.object) &&
                precedence(node.object) >= precedence(node) &&
                (
                    node.computed ||
                    !(
                        node.object.type === "Literal" &&
                        typeof node.object.value === "number" &&
                        /^[0-9]+$/.test(context.getFirstToken(node.object).value)
                    )
                )
            ) {
                report(node.object);
            }
        },
        "NewExpression": dryCallNew,
        "ObjectExpression": function(node) {
            [].forEach.call(node.properties, function(e) {
                var v = e.value;
                if (v && isParenthesised(v) && precedence(v) >= precedence({type: "AssignmentExpression"})) {
                    report(v);
                }
            });
        },
        "ReturnStatement": function(node) {
            if (node.argument && isParenthesised(node.argument)) {
                report(node.argument);
            }
        },
        "SequenceExpression": function(node) {
            [].forEach.call(node.expressions, function(e) {
                if (isParenthesised(e)) {
                    report(e);
                }
            });
        },
        "SwitchCase": function(node) {
            if (node.test && isParenthesised(node.test)) {
                report(node.test);
            }
        },
        "SwitchStatement": function(node) {
            if (isParenthesisedTwice(node.discriminant)) {
                report(node.discriminant);
            }
        },
        "ThrowStatement": function(node) {
            if (isParenthesised(node.argument)) {
                report(node.argument);
            }
        },
        "UnaryExpression": dryUnaryUpdate,
        "UpdateExpression": dryUnaryUpdate,
        "VariableDeclarator": function(node) {
            if (node.init && isParenthesised(node.init) && precedence(node.init) >= precedence({type: "AssignmentExpression"}) && !isIIFE(node.init)) {

                 report(node.init);
            }
        },
        "WhileStatement": function(node) {
            if (isParenthesisedTwice(node.test)) {
                report(node.test);
            }
        },
        "WithStatement": function(node) {
            if (isParenthesisedTwice(node.object)) {
                report(node.object);
            }
        }
    };

};
