import { computed, reactive, ref } from "vue";
import {
  cerrarSesionApi,
  iniciarSesionApi,
  limpiarToken,
  obtenerToken,
  registrarApi,
} from "~/api/auth";
import { crearReserva } from "~/api/reservas";
import type { ReservaConfirmada } from "~/api/reservas";
import type {
  DialogStep,
  ExternalRegistration,
  ResourceBooking,
  StudentCredentials,
  UserType,
} from "~/types";

declare module "~/types" {
  interface ExternalRegistration {
    password?: string;
    localidad?: string;
    provincia?: string;
    mode?: "login" | "register";
  }
}

export function useGrebAuth() {
  const step = ref<DialogStep>(1);
  const userType = ref<UserType | null>(null);
  const isSubmitting = useState<boolean>("greb_is_submitting", () => false);
  const errorMessage = ref("");
  const bookingCompleted = ref(false);
  const reservaConfirmada = ref<ReservaConfirmada | null>(null);
  const isAuthenticated = useState<boolean>(
    "greb_is_authenticated",
    () => false,
  );
  const bookingExpiresAt = useState<number | null>(
    "greb_booking_expires_at",
    () => null,
  );
  const authenticatedUser = useState<UserType | null>(
    "greb_auth_user",
    () => null,
  );

  if (import.meta.client) {
    isAuthenticated.value = Boolean(obtenerToken());
  }

  const student = reactive<StudentCredentials>({ legajo: "", password: "" });
  const external = reactive<ExternalRegistration>({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    email: "",
    password: "",
    localidad: "",
    provincia: "",
    mode: "register",
  });
  const booking = reactive<ResourceBooking>({
    resource: "",
    resourceId: 0,
    date: "",
    startTime: "",
    endTime: "",
    wantsComputer: false,
    computerConditionsAccepted: false,
  });

  function resetFlow(limpiarError = true) {
    step.value = 1;
    userType.value = null;
    isSubmitting.value = false;
    if (limpiarError) {
      errorMessage.value = "";
    }
    bookingCompleted.value = false;
    reservaConfirmada.value = null;
    isAuthenticated.value = false;
    authenticatedUser.value = null;
    bookingExpiresAt.value = null;
    Object.assign(student, { legajo: "", password: "" });
    Object.assign(external, {
      firstName: "",
      lastName: "",
      dni: "",
      phone: "",
      email: "",
      password: "",
      localidad: "",
      provincia: "",
      mode: "register",
    });
    Object.assign(booking, {
      resource: "",
      resourceId: 0,
      date: "",
      startTime: "",
      endTime: "",
      wantsComputer: false,
      computerConditionsAccepted: false,
    });
  }

  const stepLabel = computed(() => {
    if (step.value === 1) return "Identificación";
    if (step.value === 2)
      return userType.value === "student"
        ? "Acceso de estudiante"
        : "Registro externo";
    return "Reserva de recurso";
  });

  function chooseUserType(type: UserType) {
    userType.value = type;
    errorMessage.value = "";
    step.value = 2;
  }

  function goBack() {
    errorMessage.value = "";
    if (step.value === 3) {
      bookingCompleted.value = false;
      step.value = 2;
      return;
    }
    if (step.value === 2) step.value = 1;
  }

  async function login(legajoOEmail?: string, password?: string) {
    errorMessage.value = "";
    const identificador = (legajoOEmail ?? student.legajo).trim();
    const pass = password ?? student.password;

    if (!identificador || !pass) {
      errorMessage.value = "Por favor completá todos los campos.";
      return;
    }

    isSubmitting.value = true;
    try {
      const data = await iniciarSesionApi(identificador, pass);
      isAuthenticated.value = true;
      authenticatedUser.value = (
        data.usuario?.rol?.toUpperCase() === "UTN" ? "student" : "external"
      ) as UserType;
      step.value = 3;
    } catch (fallo) {
      errorMessage.value =
        fallo instanceof Error ? fallo.message : "Credenciales inválidas";
    } finally {
      isSubmitting.value = false;
    }
  }

  async function submitAuth() {
    errorMessage.value = "";
    if (userType.value === "student") {
      await login(student.legajo, student.password);
      return;
    }

    if (userType.value === "external") {
      if (external.mode === "login") {
        const cleanEmail = external.email.trim();
        const cleanPassword = external.password;
        if (!cleanEmail || !cleanPassword) {
          errorMessage.value = "Por favor completá todos los campos.";
          return;
        }
        await login(cleanEmail, cleanPassword);
        return;
      }

      if (
        !external.firstName.trim() ||
        !external.lastName.trim() ||
        !external.dni.trim() ||
        !external.phone.trim() ||
        !external.email.trim() ||
        !external.password ||
        !external.localidad?.trim() ||
        !external.provincia?.trim()
      ) {
        errorMessage.value = "Completá todos los campos para continuar.";
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(external.email)) {
        errorMessage.value = "Ingresá un correo electrónico válido.";
        return;
      }

      if (
        !/^\d{7,15}$/.test(external.dni.trim()) ||
        !/^\+?[\d\s-]{7,20}$/.test(external.phone.trim())
      ) {
        errorMessage.value = "Ingresá un DNI y un celular válidos.";
        return;
      }

      if (external.password.length < 8) {
        errorMessage.value = "La contraseña debe tener al menos 8 caracteres.";
        return;
      }

      if (new TextEncoder().encode(external.password).length > 72) {
        errorMessage.value = "La contraseña no puede superar 72 bytes";
        return;
      }

      isSubmitting.value = true;
      try {
        await registrarApi({
          rol: "EXTERNO",
          tipoDocumento: "DNI",
          documento: external.dni.trim(),
          nombre: external.firstName.trim(),
          apellido: external.lastName.trim(),
          email: external.email.trim().toLowerCase(),
          telefono: external.phone.trim(),
          password: external.password,
          localidad: external.localidad.trim(),
          provincia: external.provincia.trim(),
          organizacion: "Particular",
        });
        isAuthenticated.value = true;
        authenticatedUser.value = "external";
        step.value = 3;
      } catch (fallo) {
        errorMessage.value =
          fallo instanceof Error ? fallo.message : "Error al registrar usuario";
      } finally {
        isSubmitting.value = false;
      }
    }
  }

  async function logout() {
    isSubmitting.value = true;
    errorMessage.value = "";
    try {
      const token = obtenerToken();
      if (token) {
        await cerrarSesionApi(token);
      }
    } catch (fallo) {
      errorMessage.value =
        fallo instanceof Error
          ? fallo.message
          : "No pudimos cerrar la sesión en el servidor.";
    } finally {
      limpiarToken();
      resetFlow(false);
      isSubmitting.value = false;
      await navigateTo("/");
    }
  }

  async function submitBooking() {
    errorMessage.value = "";
    if (
      !booking.resourceId ||
      !booking.date ||
      !booking.startTime ||
      !booking.endTime
    ) {
      errorMessage.value = "Completá los datos requeridos para reservar.";
      return;
    }

    if (
      bookingExpiresAt.value !== null &&
      Date.now() > bookingExpiresAt.value
    ) {
      errorMessage.value =
        "El tiempo para completar tu reserva ha vencido. Por favor, seleccioná nuevamente un horario.";
      return;
    }

    if (booking.wantsComputer && !booking.computerConditionsAccepted) {
      errorMessage.value =
        "Debés aceptar las condiciones de uso de la notebook.";
      return;
    }

    isSubmitting.value = true;
    try {
      const confirmada = await crearReserva({
        fecha: booking.date,
        inicio: booking.startTime,
        fin: booking.endTime,
        salaId: booking.resourceId,
        salaNombre: booking.resource,
        conNotebook: booking.wantsComputer,
      });

      reservaConfirmada.value = confirmada;
      bookingCompleted.value = true;
    } catch (fallo) {
      errorMessage.value =
        fallo instanceof Error
          ? fallo.message
          : "No pudimos confirmar la reserva.";
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    step,
    userType,
    student,
    external,
    booking,
    bookingExpiresAt,
    isSubmitting,
    errorMessage,
    bookingCompleted,
    reservaConfirmada,
    stepLabel,
    chooseUserType,
    goBack,
    login,
    submitAuth,
    submitBooking,
    resetFlow,
    isAuthenticated,
    authenticatedUser,
    logout,
  };
}
