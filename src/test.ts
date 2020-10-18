import {SmartType} from "./SmartTypes";

type Age = SmartType<typeof ValidateAge>

class MySmartType implements SmartType<typeof ValidateAge> { }

interface MySmartInterface extends SmartType<typeof ValidateAge>  { }

function ValidateAge(age: any) {
    return {
        isValid: Number.isInteger(age) && age >= 18 && age <= 90,
        message: "Driver's age must be at least 18 and no bigger than 90"
    }
}

// #1: Function with smart type argument
export function issueDriverLicense(age: Age) {
    return `age: ${age}`
}

issueDriverLicense(100 as Age)
issueDriverLicense(8)


// #2: Explicit cast to a smart type
const ag = 100 as Age
const ag3 = getNumber() as Age
const ag5 = getAge() as Age

// #3: Struct with a smart type field
interface Driver {
    age: Age
}

const dr: Driver = {age: 100}

// #4: Class with a smart type field
class Dr {
    constructor(private age: Age) {

    }

    public setAge(age: Age) {
        this.age = age
    }

    public setAgeToSomeValues() {
        this.age = 100
        this.age = 43
    }

    public getSomeAge(): Age {
        return 100
    }
}

const drdr = new Dr(100)
drdr.setAge(100)

// #5: Assignment to a smart typed variable
const age: Age = 100
const age123: Age = 100 as number
let ageLet = 50 as Age
ageLet = 600

// #6: Func call that returns aliased type
function getNumber(): number {
    return 80
}

issueDriverLicense(getNumber())

// #7: Func call that returns a smart type
function getAge(): Age {
    return 90
}

issueDriverLicense(getAge())

// #8: Const identifier passed to a function
const someAge = 90
issueDriverLicense(someAge)

// #9: Let identifier passed to a function
let someAgeNotConstant = 90
issueDriverLicense(someAgeNotConstant)

// #10: Cast when func return
function myFunc(): Age {
    const age = 100
    return age
}

function myFunc2(): Age {
    return getNumber()
}

function myFunc3(): Age {
    return getAge()
}

// #11: Smart typed identifier
const validAge: Age = 80
issueDriverLicense(validAge)

// #12: Cast to a wrong type
issueDriverLicense(100 as number)

// #13: Math
issueDriverLicense(50 + 50)
issueDriverLicense(16 / 2)
issueDriverLicense(50 - 50)
issueDriverLicense(50 * 5)


type Email = SmartType<typeof ValidateEmail>
function ValidateEmail(email: any) {
    return {
        isValid: RegExp("[a-zA-Z0-9-\.]+@[a-zA-Z0-9-.]+.[a-zA-Z0-9-.]+").test(email),
        message: "Email should look like name@site.com"
    }
}

function createNewEmail(email: Email) {
}

createNewEmail("tubignat@gmail.com")
createNewEmail("wrognEmil")


