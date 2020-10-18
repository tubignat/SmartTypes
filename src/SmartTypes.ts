export interface SmartTypeValidationResult {
    isValid: boolean
    message: string
}

export type SmartTypeValidator = (value: any) => SmartTypeValidationResult

export interface SmartType<TValidator extends SmartTypeValidator> {}
