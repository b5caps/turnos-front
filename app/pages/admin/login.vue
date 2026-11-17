<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  iniciarSesionApi,
  limpiarToken,
  limpiarUsuarioRol,
  obtenerToken,
  guardarToken,
  validarSesionApi,
} from "~/api/auth";
import { rolDeLaSesion } from "~/api/admin";
import { BOTON_PRIMARIO, CAMPO, ERROR, ETIQUETA } from "~/constants/estilos";

const usuario = ref("");
const password = ref("");
const enviando = ref(false);
const errorMessage = ref("");
const route = useRoute();

onMounted(async () => {
  if (route.query.error === "sesion_vencida") {
    errorMessage.value =
      "Tu sesión ha vencido. Por favor, volvé a iniciar sesión.";
  }
  const token = obtenerToken();
  if (
    token &&
    rolDeLaSesion() === "ADMIN" &&
    route.query.error !== "sesion_vencida"
  ) {
    const usuarioValido = await validarSesionApi(token);
    if (usuarioValido && usuarioValido.rol === "ADMIN") {
      guardarToken(token);
      navigateTo("/admin");
    } else {
      limpiarToken();
      limpiarUsuarioRol();
      errorMessage.value =
        "Tu sesión ha vencido. Por favor, volvé a iniciar sesión.";
    }
  }
});

async function ingresar() {
  errorMessage.value = "";
  const identificador = usuario.value.trim();

  if (!identificador || !password.value) {
    errorMessage.value = "Completá todos los campos.";
    return;
  }

  enviando.value = true;
  try {
    const data = await iniciarSesionApi(identificador, password.value);
    if (data.usuario?.rol !== "ADMIN") {
      limpiarToken();
      errorMessage.value = "Esta cuenta no tiene permisos de administración.";
      return;
    }
    await navigateTo("/admin");
  } catch (fallo) {
    errorMessage.value =
      fallo instanceof Error ? fallo.message : "Credenciales inválidas.";
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-paper font-sans text-ink">
    <div class="grid min-h-screen place-items-center px-6 py-10">
      <section
        aria-labelledby="admin-login-titulo"
        class="w-[min(100%,400px)] animate-rise rounded-xl border border-line bg-white p-8 shadow-card max-tablet:p-6"
      >
        <img
          alt="UTN GREB"
          class="mb-6 h-8 w-auto object-contain"
          src="/Logo_GREB.jpg"
        />

        <h1
          id="admin-login-titulo"
          class="m-0 text-2xl font-bold tracking-tight"
        >
          Ingreso Administración
        </h1>

        <form class="grid gap-4" @submit.prevent="ingresar">
          <label :class="ETIQUETA">
            Correo o legajo
            <input
              v-model="usuario"
              autocomplete="username"
              :class="CAMPO"
              required
              type="text"
            />
          </label>
          <label :class="ETIQUETA">
            Contraseña
            <input
              v-model="password"
              autocomplete="current-password"
              :class="CAMPO"
              required
              type="password"
            />
          </label>

          <p v-if="errorMessage" :class="ERROR">{{ errorMessage }}</p>

          <button
            :class="[BOTON_PRIMARIO, 'mt-2 w-full']"
            :disabled="enviando"
            type="submit"
          >
            {{ enviando ? "Verificando..." : "Ingresar" }}
          </button>
        </form>
      </section>
    </div>
  </main>
</template>
