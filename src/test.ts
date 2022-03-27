import {SmartType} from "./SmartTypes";

type Age = SmartType<typeof ValidateAge>

class MySmartType implements SmartType<typeof ValidateAge> {}

interface MySmartInterface extends SmartType<typeof ValidateAge> {}

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

issueDriverLicense(100) // error
issueDriverLicense(8) // error
issueDriverLicense(20) // ok

// #2: Explicit cast to a smart type
const ag = 100 as Age // error

const ag123asdf: Age = 100, // error
    abc = 100 as Age // error

const ag3 = getNumber() as Age // error

const ag5 = getAge() as Age // ok

// #3: Struct with a smart type field
interface Driver {
    age: Age
}

const dr: Driver = { age: 100 } // error
const dr2: Driver = { age: getAge() } // ok
const dr3: Driver = { age: getNumber() } // error
const drdrdr = { age: 100 } as Driver // error
const validDr: Driver = {age: 80} // ok

function abcdf(driver: Driver) {}

abcdf({age: 100}) // error
abcdf({age: 80}) // ok

// #3.1: Cast objects

interface DriverWithNoSmartTypes {
    age: number
}

// const drNoSmartTypes: DriverWithNoSmartTypes = validDr // error

interface DriverWithDifferentSmartType {
    age: SmartType<any>
}

const drDifSmartType: DriverWithDifferentSmartType = validDr // error !

// #3.2: Array literals

const ages: Age[] = [100, 100, 18, 90] // error !

// #3.3: Nested

interface DriverExtended {
    driver: Driver
    name: string
}

const drExtended: DriverExtended = {
    name: "John Doe",
    driver: {
        age: 100 // error
    }
}

// #4: Class with a smart type field
class Dr {
    constructor(private age: Age) {
    }

    public setAge(age: Age) {
        this.age = age // ok
    }

    public setAgeToSomeValues(age: number) {
        this.age = age // error
        this.age = 100 // error
        this.age = 43 // ok
    }

    public getSomeAge(): Age {
        return 100 // error
    }

    public getValidAge(): Age {
        return 80 // ok
    }

    public age2: Age
}

const drdr = new Dr(100) // error
const validdrdr = new Dr(80) // ok
validdrdr.setAge(100) // error
validdrdr.setAge(80) // ok
validdrdr.age2 = 100 // error

// #5: Assignment to a smart typed variable

const age8789: Age = 100 // error

const age123: Age = 100 as number // error

let ageLet = 50 as Age // ok

ageLet = 100 // error

ageLet = 43 // ok

// #6: Func call that returns aliased type
function getNumber(): number {
    return 80
}

issueDriverLicense(getNumber()) // error

// #7: Func call that returns a smart type
function getAge(): Age {
    return 90
}

function getAgeImplicit() {
    return 90 as Age
}

issueDriverLicense(getAge()) // ok
issueDriverLicense(getAgeImplicit()) // error

// #7.1: Func call returns union of smart type and another type
function getAgeOr100(shouldReturnAge: boolean): Age | 100 {
    if (shouldReturnAge) {
        return 90
    }
    return 100
}

function getAgeOr100Implicit(shouldReturnAge: boolean) {
    if (shouldReturnAge) {
        return 90 as Age
    }
    return 100
}

issueDriverLicense(getAgeOr100(false)) // error
issueDriverLicense(getAgeOr100Implicit(false)) // error

// #8: Const identifier passed to a function
const someAge = 90
issueDriverLicense(someAge) // ok

// #9: Let identifier passed to a function
let someAgeNotConstant = 90
issueDriverLicense(someAgeNotConstant) // error

// #10: Cast when func return
function myFunc(): Age {
    const age = 100
    return age // error
}

function myFunc4(): Age {
    const age = 50
    return age // ok
}

function myFunc2(): Age {
    return getNumber() // error
}

function myFunc3(): Age {
    return getAge() // ok
}

// #10.1: Cast when func return, nested return
function myFuncNestedReturn(): Age {
    if (true) {
        return 100 // error

    } else if (true) {
        return 50 // ok
    }

    return 100 // error
}

// #10.2: nested return of arrow func
function myFuncArrow(): Age {
    const lambda = () => {
        return 100 // ok
    }

    const lambdaWithAge = (): Age => {
        return 100 // error
    }

    const anonymous = function () {
        return 100 // ok
    }

    const anonymousWithAge = function (): Age {
        return 100 // error
    }

    return 100    // error
}

// #11: Smart typed identifier
let invalidAge: Age = 99

let validAge: Age = 80
issueDriverLicense(validAge) // ok

// #12: Cast to a wrong type
issueDriverLicense(100 as number) // error

// #13: Math
issueDriverLicense(50 + 50) // error
issueDriverLicense(16 / 2) // error
issueDriverLicense(50 - 50) // error
issueDriverLicense(50 * 5) // error
issueDriverLicense(16 + 16) // ok !

// #14: Strings
type Email = SmartType<typeof ValidateEmail>

function ValidateEmail(email: any) {
    return {
        isValid: RegExp("^[a-zA-Z0-9-\.]+@[a-zA-Z0-9-\.]+\\.[a-zA-Z0-9-.]+$").test(email),
        message: "Email should look like name@site.com"
    }
}

function createNewEmail(email: Email) {
}

createNewEmail("tubignat@gmail.com") // ok
createNewEmail("wrong@email") // error

// #15: Formatting
// @formatter:off
issueDriverLicense(8)
issueDriverLicense(         100)
issueDriverLicense(100          )
issueDriverLicense(         100          )
issueDriverLicense(
    100)
issueDriverLicense(100
)

function issue(age: Age, age2: Age): number { return 100 }

issue(
    100,
    100
)

issue(getNumber(

), issue(
    100,
    100
))
// @formatter:on


// #16: Branching, asserting value is valid
function unsafeCreateAge(value: number): Age {
    const validation = ValidateAge(value)
    if (!validation.isValid) {
        throw new Error(validation.message)
    }

    return value // ok !
}
