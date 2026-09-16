import { computed, reactive, ref } from 'vue'
import type { DialogStep, ExternalRegistration, ResourceBooking, StudentCredentials, UserType } from '~/types'

export function useGrebAuth() {
  const step = ref<DialogStep>(1)
  const userType = ref<UserType | null>(null)
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const bookingCompleted = ref(false)
  const isAuthenticated = ref(false)
  const authenticatedUser = ref<UserType | null>(null)

  const student = reactive<StudentCredentials>({ legajo: '', password: '' })
  const external = reactive<ExternalRegistration>({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    email: '',
  })
  const booking = reactive<ResourceBooking>({ resource: '', date: '', startTime: '', endTime: '', wantsComputer: false, computerConditionsAccepted: false })

  function resetFlow() {
    step.value = 1
    userType.value = null
    isSubmitting.value = false
    errorMessage.value = ''
    bookingCompleted.value = false
    isAuthenticated.value = false
    authenticatedUser.value = null
    Object.assign(student, { legajo: '', password: '' })
    Object.assign(external, { firstName: '', lastName: '', dni: '', phone: '', email: '' })
    Object.assign(booking, { resource: '', date: '', startTime: '', endTime: '', wantsComputer: false, computerConditionsAccepted: false })
  }

  const stepLabel = computed(() => {
    if (step.value === 1) return 'Identificación'
    if (step.value === 2) return userType.value === 'student' ? 'Acceso de estudiante' : 'Registro externo'
    return 'Reserva de recurso'
  })

  function chooseUserType(type: UserType) {
    userType.value = type
    errorMessage.value = ''
    step.value = 2
  }

  function goBack() {
    errorMessage.value = ''
    if (step.value === 3) {
      bookingCompleted.value = false
      step.value = 2
      return
    }
    if (step.value === 2) step.value = 1
  }

  function submitAuth() {
    errorMessage.value = ''
    if (userType.value === 'student') {
      if (!student.legajo.trim() || !student.password) {
        errorMessage.value = 'Completá tu legajo y contraseña para continuar.'
        return
      }
      if (student.legajo !== '16868' || student.password !== 'catalina') {
        errorMessage.value = 'Legajo o contraseña de Sysacad incorrectos'
        return
      }
    } else if (!external.firstName.trim() || !external.lastName.trim() || !external.dni.trim() || !external.phone.trim() || !external.email.trim()) {
      errorMessage.value = 'Completá todos los campos para continuar.'
      return
    } else if (!/^\S+@\S+\.\S+$/.test(external.email)) {
      errorMessage.value = 'Ingresá un correo electrónico válido.'
      return
    } else if (!/^\d{7,15}$/.test(external.dni.trim()) || !/^\+?[\d\s-]{7,20}$/.test(external.phone.trim())) {
      errorMessage.value = 'Ingresá un DNI y un celular válidos.'
      return
    }

    isSubmitting.value = true
    window.setTimeout(() => {
      isSubmitting.value = false
      isAuthenticated.value = true
      authenticatedUser.value = userType.value
      step.value = 3
    }, 250)
  }

  function submitBooking() {
    errorMessage.value = ''
    if (!booking.resource || !booking.date || !booking.startTime || !booking.endTime) {
      errorMessage.value = 'Completá el recurso, la fecha y el horario de la reserva.'
      return
    }
    if (booking.endTime <= booking.startTime) {
      errorMessage.value = 'La hora de fin debe ser posterior a la hora de inicio.'
      return
    }
    if (booking.wantsComputer && !booking.computerConditionsAccepted) {
      errorMessage.value = 'Aceptá las condiciones de uso de la PC para confirmar la reserva.'
      return
    }
    bookingCompleted.value = true
  }

  return { step, userType, student, external, booking, isSubmitting, errorMessage, bookingCompleted, isAuthenticated, authenticatedUser, stepLabel, chooseUserType, goBack, submitAuth, submitBooking, resetFlow }
}
