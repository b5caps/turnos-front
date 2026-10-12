<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ACCIONES,
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  CAMPO,
  ERROR,
  ETIQUETA,
  FLECHA_BOTON,
  INTRO,
  INTRO_TEXTO,
  INTRO_TITULO,
  KICKER,
} from "~/constants/estilos";
import type { ExternalRegistration } from "~/types";

const props = defineProps<{
  modelValue: ExternalRegistration;
  loading?: boolean;
  error?: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: ExternalRegistration];
  "register-success": [value: ExternalRegistration];
  "login-success": [value: ExternalRegistration];
  back: [];
}>();
const localError = ref("");
function update(field: keyof ExternalRegistration, value: string) {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
}
const isLogin = computed(
  () => (props.modelValue.mode ?? "register") === "login",
);
function setMode(newMode: "login" | "register") {
  localError.value = "";
  emit("update:modelValue", { ...props.modelValue, mode: newMode });
}
const firstName = computed({
  get: () => props.modelValue.firstName,
  set: (value: string) => update("firstName", value),
});
const lastName = computed({
  get: () => props.modelValue.lastName,
  set: (value: string) => update("lastName", value),
});
const dni = computed({
  get: () => props.modelValue.dni,
  set: (value: string) => update("dni", value),
});
const phone = computed({
  get: () => props.modelValue.phone,
  set: (value: string) => update("phone", value),
});
const email = computed({
  get: () => props.modelValue.email,
  set: (value: string) => update("email", value),
});
const password = computed({
  get: () => props.modelValue.password ?? "",
  set: (value: string) => update("password", value),
});
const localidad = computed({
  get: () => props.modelValue.localidad ?? "",
  set: (value: string) => update("localidad", value),
});
const provincia = computed({
  get: () => props.modelValue.provincia ?? "",
  set: (value: string) => update("provincia", value),
});

function handleSubmit() {
  localError.value = "";

  if (isLogin.value) {
    const cleanEmail = email.value.trim();
    const cleanPassword = password.value;

    if (!cleanEmail || !cleanPassword) {
      localError.value = "Por favor completá todos los campos.";
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      localError.value = "Ingresá un correo electrónico válido.";
      return;
    }

    const cleanData: ExternalRegistration = {
      ...props.modelValue,
      email: cleanEmail,
      password: cleanPassword,
      mode: "login",
    };

    emit("update:modelValue", cleanData);
    emit("login-success", cleanData);
    return;
  }

  const cleanData: ExternalRegistration = {
    ...props.modelValue,
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    dni: dni.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    password: password.value,
    localidad: localidad.value.trim(),
    provincia: provincia.value.trim(),
    mode: "register",
  };

  if (
    !cleanData.firstName ||
    !cleanData.lastName ||
    !cleanData.dni ||
    !cleanData.phone ||
    !cleanData.email ||
    !cleanData.password ||
    !cleanData.localidad ||
    !cleanData.provincia
  ) {
    localError.value = "Por favor completá todos los campos.";
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanData.email)) {
    localError.value = "Ingresá un correo electrónico válido.";
    return;
  }
  if (
    !/^\d{7,15}$/.test(cleanData.dni) ||
    !/^\+?[\d\s-]{7,20}$/.test(cleanData.phone)
  ) {
    localError.value = "Ingresá un DNI y un celular válidos.";
    return;
  }
  if (cleanData.password.length < 8) {
    localError.value = "La contraseña debe tener al menos 8 caracteres.";
    return;
  }

  emit("update:modelValue", cleanData);
  emit("register-success", cleanData);
}
</script>

<template>
  <div>
    <div :class="INTRO">
      <p :class="KICKER">Registro externo</p>
      <h2 :class="INTRO_TITULO">
        {{ isLogin ? "Ingresá a GREB" : "Creá tu acceso" }}
      </h2>
      <p :class="INTRO_TEXTO">
        {{
          isLogin
            ? "Ingresá con tu correo electrónico y contraseña."
            : "Completá tus datos para reservar recursos de la biblioteca."
        }}
      </p>
    </div>

    <div class="mb-5 flex items-center gap-2 text-mini">
      <span class="text-muted">¿Ya tenés cuenta?</span>
      <button
        type="button"
        class="cursor-pointer border-b text-mini font-bold transition-colors"
        :class="
          isLogin
            ? 'border-forest text-forest'
            : 'border-transparent text-muted hover:text-ink'
        "
        @click="setMode('login')"
      >
        Ingresar
      </button>
      <span class="text-muted">/</span>
      <button
        type="button"
        class="cursor-pointer border-b text-mini font-bold transition-colors"
        :class="
          !isLogin
            ? 'border-forest text-forest'
            : 'border-transparent text-muted hover:text-ink'
        "
        @click="setMode('register')"
      >
        Registrarme
      </button>
    </div>

    <form v-if="isLogin" class="grid gap-4" @submit.prevent="handleSubmit">
      <label :class="ETIQUETA"
        >Correo electrónico<input
          v-model="email"
          autocomplete="email"
          :class="CAMPO"
          required
          type="email"
      /></label>
      <label :class="ETIQUETA"
        >Contraseña<input
          v-model="password"
          autocomplete="current-password"
          :class="CAMPO"
          required
          type="password"
      /></label>
      <p v-if="localError || props.error" :class="ERROR">
        {{ localError || props.error }}
      </p>
      <div :class="ACCIONES">
        <button :class="BOTON_SUAVE" type="button" @click="emit('back')">
          ← Volver
        </button>
        <button :class="BOTON_PRIMARIO" :disabled="loading" type="submit">
          {{ loading ? "Verificando..." : "Iniciar sesión" }}
          <span :class="FLECHA_BOTON">→</span>
        </button>
      </div>
    </form>

    <form
      v-else
      class="grid grid-cols-2 gap-x-4 gap-y-3.5 max-tablet:grid-cols-1"
      @submit.prevent="handleSubmit"
    >
      <label :class="ETIQUETA"
        >Nombre<input
          v-model="firstName"
          autocomplete="given-name"
          :class="CAMPO"
          required
      /></label>
      <label :class="ETIQUETA"
        >Apellido<input
          v-model="lastName"
          autocomplete="family-name"
          :class="CAMPO"
          required
      /></label>
      <label :class="ETIQUETA"
        >DNI<input v-model="dni" :class="CAMPO" inputmode="numeric" required
      /></label>
      <label :class="ETIQUETA"
        >Celular<input
          v-model="phone"
          autocomplete="tel"
          :class="CAMPO"
          inputmode="tel"
          required
      /></label>
      <label :class="ETIQUETA"
        >Localidad<input v-model="localidad" :class="CAMPO" required
      /></label>
      <label :class="ETIQUETA"
        >Provincia<input v-model="provincia" :class="CAMPO" required
      /></label>
      <label :class="[ETIQUETA, 'col-span-full max-tablet:col-auto']"
        >Correo electrónico<input
          v-model="email"
          autocomplete="email"
          :class="CAMPO"
          required
          type="email"
      /></label>
      <label :class="[ETIQUETA, 'col-span-full max-tablet:col-auto']"
        >Contraseña<input
          v-model="password"
          autocomplete="new-password"
          :class="CAMPO"
          minlength="8"
          required
          type="password"
      /></label>
      <p
        v-if="localError || props.error"
        :class="[ERROR, 'col-span-full max-tablet:col-auto']"
      >
        {{ localError || props.error }}
      </p>
      <div :class="[ACCIONES, 'col-span-full max-tablet:col-auto']">
        <button :class="BOTON_SUAVE" type="button" @click="emit('back')">
          ← Volver
        </button>
        <button :class="BOTON_PRIMARIO" :disabled="loading" type="submit">
          {{ loading ? "Guardando..." : "Registrarse e ingresar" }}
          <span :class="FLECHA_BOTON">→</span>
        </button>
      </div>
    </form>
  </div>
</template>
