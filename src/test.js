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
issueDriverLicense(100);
issueDriverLicense(8);
// #2: Explicit cast to a smart type
var ag = 100;
var ag3 = getNumber();
var ag5 = getAge();
var dr = { age: 100 };
function abcdf(driver) { }
abcdf({ age: 100 });
// #4: Class with a smart type field
var Dr = /** @class */ (function () {
    function Dr(age) {
        this.age = age;
    }
    Dr.prototype.setAge = function (age) {
        this.age = age;
    };
    Dr.prototype.setAgeToSomeValues = function () {
        this.age = 100;
        this.age = 43;
    };
    Dr.prototype.getSomeAge = function () {
        return 100;
    };
    return Dr;
}());
var drdr = new Dr(100);
drdr.setAge(100);
// #5: Assignment to a smart typed variable
var age = 100;
var age123 = 100;
var ageLet = 50;
ageLet = 600;
// #6: Func call that returns aliased type
function getNumber() {
    return 80;
}
issueDriverLicense(getNumber());
// #7: Func call that returns a smart type
function getAge() {
    return 90;
}
issueDriverLicense(getAge());
// #8: Const identifier passed to a function
var someAge = 90;
issueDriverLicense(someAge);
// #9: Let identifier passed to a function
var someAgeNotConstant = 90;
issueDriverLicense(someAgeNotConstant);
// #10: Cast when func return
function myFunc() {
    var age = 100;
    return age;
}
function myFunc2() {
    return getNumber();
}
function myFunc3() {
    return getAge();
}
// #11: Smart typed identifier
var validAge = 80;
issueDriverLicense(validAge);
// #12: Cast to a wrong type
issueDriverLicense(100);
// #13: Math
issueDriverLicense(50 + 50);
issueDriverLicense(16 / 2);
issueDriverLicense(50 - 50);
issueDriverLicense(50 * 5);
function ValidateEmail(email) {
    return {
        isValid: RegExp("^[a-zA-Z0-9-\.]+@[a-zA-Z0-9-\.]+\\.[a-zA-Z0-9-.]+$").test(email),
        message: "Email should look like name@site.com"
    };
}
function createNewEmail(email) {
}
createNewEmail("tub.ignat@gmail.com");
createNewEmail("wrong@email");
//# sourceMappingURL=test.js.map