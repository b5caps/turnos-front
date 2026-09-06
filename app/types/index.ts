export type UserType = 'student' | 'external'
export type DialogStep = 1 | 2 | 3

export interface StudentCredentials {
  legajo: string
  password: string
}

export interface ExternalRegistration {
  firstName: string
  lastName: string
  dni: string
  phone: string
  email: string
}

export interface ResourceBooking {
  resource: string
  date: string
  startTime: string
  endTime: string
  wantsComputer: boolean
  computerConditionsAccepted: boolean
}
