/**
 * @fileoverview Tests for no-spaced-func rule.
 * @author Matt DuVall <http://www.mattduvall.com>
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var eslintTester = require("eslint-tester");

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

eslintTester.addRuleTest("lib/rules/no-spaced-func", {
    valid: [
        "f();",
        "f(a, b);",
        "f.b();",
        "f.b().c();",
        "f()()",
        "(function() {}())",
        "var f = new Foo()",
        "var f = new Foo",
        "f( (0) )",
        "( f )( 0 )",
        "( (f) )( (0) )",
        "(function(){ if (foo) { bar(); } }());",
        "f(0, (1))"
    ],
    invalid: [
        { code: "f ();", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "f (a, b);", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "f\n();", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "f.b ();", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "f.b().c ();", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "f() ()", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "(function() {} ())", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "var f = new Foo ()", errors: [{ message: "Unexpected space between function name and paren.", type: "NewExpression"}] },
        { code: "f ( (0) )", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "f(0) (1)", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] },
        { code: "(f) (0)", errors: [{ message: "Unexpected space between function name and paren.", type: "CallExpression"}] }
    ]
});
