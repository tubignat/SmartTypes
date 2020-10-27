"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueDriverLicense = void 0;
var MySmartType = /** @class */ (function () {
    function MySmartType() {
    }
    return MySmartType;
}());
function ValidateAge(age) {
    return {
        isValid: Number.isInteger(age) && age >= 18 && age <= 90,
        message: "Driver's age must be at least 18 and no bigger than 90"
    };
}
// #1: Function with smart type argument
function issueDriverLicense(age) {
    return "age: " + age;
}
exports.issueDriverLicense = issueDriverLicense;
issueDriverLicense(100); // error
issueDriverLicense(8); // error
issueDriverLicense(20); // ok
// #2: Explicit cast to a smart type
var ag = 100; // error
var ag123asdf = 100, // error
abc = 100; // error
var ag3 = getNumber(); // error
var ag5 = getAge(); // ok
var dr = { age: 100 }; // error
var dr2 = { age: getAge() }; // ok
var dr3 = { age: getNumber() }; // error
var drdrdr = { age: 100 }; // error
var validDr = { age: 80 }; // ok
function abcdf(driver) { }
abcdf({ age: 100 }); // error
abcdf({ age: 80 }); // ok
var drDifSmartType = validDr; // error !
// #3.2: Array literals
var ages = [100, 100, 18, 90]; // error !
var drExtended = {
    name: "John Doe",
    driver: {
        age: 100 // error
    }
};
// #4: Class with a smart type field
var Dr = /** @class */ (function () {
    function Dr(age) {
        this.age = age;
    }
    Dr.prototype.setAge = function (age) {
        this.age = age; // ok
    };
    Dr.prototype.setAgeToSomeValues = function (age) {
        this.age = age; // error
        this.age = 100; // error
        this.age = 43; // ok
    };
    Dr.prototype.getSomeAge = function () {
        return 100; // error
    };
    Dr.prototype.getValidAge = function () {
        return 80; // ok
    };
    return Dr;
}());
var drdr = new Dr(100); // error
var validdrdr = new Dr(80); // ok
validdrdr.setAge(100); // error
validdrdr.setAge(80); // ok
validdrdr.age2 = 100; // error
// #5: Assignment to a smart typed variable
var age = 100; // error
var age123 = 100; // error
var ageLet = 50; // ok
ageLet = 100; // error
ageLet = 43; // ok
// #6: Func call that returns aliased type
function getNumber() {
    return 80;
}
issueDriverLicense(getNumber()); // error
// #7: Func call that returns a smart type
function getAge() {
    return 90;
}
function getAgeImplicit() {
    return 90;
}
issueDriverLicense(getAge()); // ok
issueDriverLicense(getAgeImplicit()); // error
// #7.1: Func call returns union of smart type and another type
function getAgeOr100(shouldReturnAge) {
    if (shouldReturnAge) {
        return 90;
    }
    return 100;
}
function getAgeOr100Implicit(shouldReturnAge) {
    if (shouldReturnAge) {
        return 90;
    }
    return 100;
}
issueDriverLicense(getAgeOr100(false)); // error
issueDriverLicense(getAgeOr100Implicit(false)); // error
// #8: Const identifier passed to a function
var someAge = 90;
issueDriverLicense(someAge); // ok
// #9: Let identifier passed to a function
var someAgeNotConstant = 90;
issueDriverLicense(someAgeNotConstant); // error
// #10: Cast when func return
function myFunc() {
    var age = 100;
    return age; // error
}
function myFunc4() {
    var age = 50;
    return age; // ok
}
function myFunc2() {
    return getNumber(); // error
}
function myFunc3() {
    return getAge(); // ok
}
// #10.1: Cast when func return, nested return
function myFuncNestedReturn() {
    if (true) {
        return 100; // error
    }
    else if (true) {
        return 50; // ok
    }
    return 100; // error
}
// #10.2: nested return of arrow func
function myFuncArrow() {
    var lambda = function () {
        return 100; // ok
    };
    var lambdaWithAge = function () {
        return 100; // error
    };
    var anonymous = function () {
        return 100; // ok
    };
    var anonymousWithAge = function () {
        return 100; // error
    };
    return 100; // error
}
// #11: Smart typed identifier
var validAge = 80;
issueDriverLicense(validAge); // ok
// #12: Cast to a wrong type
issueDriverLicense(100); // error
// #13: Math
issueDriverLicense(50 + 50); // error
issueDriverLicense(16 / 2); // error
issueDriverLicense(50 - 50); // error
issueDriverLicense(50 * 5); // error
issueDriverLicense(16 + 16); // ok !
function ValidateEmail(email) {
    return {
        isValid: RegExp("^[a-zA-Z0-9-\.]+@[a-zA-Z0-9-\.]+\\.[a-zA-Z0-9-.]+$").test(email),
        message: "Email should look like name@site.com"
    };
}
function createNewEmail(email) {
}
createNewEmail("tubignat@gmail.com"); // ok
createNewEmail("wrong@email"); // error
// #15: Formatting
// @formatter:off
issueDriverLicense(8);
issueDriverLicense(100);
issueDriverLicense(100);
issueDriverLicense(100);
issueDriverLicense(100);
issueDriverLicense(100);
function issue(age, age2) { return 100; }
issue(100, 100);
issue(getNumber(), issue(100, 100));
// @formatter:on
// #16: Branching, asserting value is valid
function unsafeCreateAge(value) {
    var validation = ValidateAge(value);
    if (!validation.isValid) {
        throw new Error(validation.message);
    }
    return value; // ok !
}
//# sourceMappingURL=test.js.map