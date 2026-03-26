/* ================================
   🌗 Sistema de cambio de tema
   ================================ */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  const themes = ["", "light", "retroGameBoy", "retroNES", "retroSNES", "retroGameCube", "retroPlayStation", "retroSegaGenesis", "cyberpunk", "neonTokyo", "minimalistaClaro", "minimalistaOscuro", "glassmorphism", "desierto", "oceano", "bosque", "montania"];
  let index = 0;

  const updateButtonText = (theme) => {
    switch(theme) {
      case "":
        btn.textContent = "🌑 Oscuro";
        break;
      case "light":
        btn.textContent = "🌞 Claro";
        break;
      case "retroGameBoy":
        btn.textContent = "🕹️ Retro GameBoy";
        break;
      case "retroNES":
        btn.textContent = "🕹️ Retro NES";
        break;
      case "retroSNES":
        btn.textContent = "🕹️ Retro SNES";
        break;
      case "retroGameCube":
        btn.textContent = "🎮 GameCube";
        break;
      case "retroPlayStation":
        btn.textContent = "🎮 PlayStation";
        break;
      case "retroSegaGenesis":
        btn.textContent = "🎮 Sega Genesis";
        break;
      case "cyberpunk":
        btn.textContent = "🌆 Cyberpunk";
        break;
      case "neonTokyo":
        btn.textContent = "🌆 Neon Tokyo";
        break;
      case "minimalistaClaro":
        btn.textContent = "🌆 Minimalista Claro";
        break;
      case "minimalistaOscuro":
        btn.textContent = "🌆 Minimalista Oscuro";
        break;
      case "glassmorphism":
        btn.textContent = "🌆 Glassmorphism";
        break;
      case "desierto":
        btn.textContent = "🏜️ Desierto";
        break;
      case "oceano":
        btn.textContent = "💧 Océano";
        break;
      case "bosque":
        btn.textContent = "🌿 Bosque";
        break;
      case "montania":
        btn.textContent = "🏔️ Montaña";
        break;
    }
  }

  // Cargar tema guardado si existe
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.setAttribute("data-theme", savedTheme);
    index = themes.indexOf(savedTheme);
  } else {
    updateButtonText(""); // Tema oscuro por defecto
  }
  updateButtonText(savedTheme || ""); // Asegura mostrar tema actual al cargar

  // Cambiar tema al hacer clic
  btn.addEventListener("click", () => {
    index = (index + 1) % themes.length;
    const nextTheme = themes[index];

    if (nextTheme === "") {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.setAttribute("data-theme", nextTheme);
    }

    updateButtonText(nextTheme);
    localStorage.setItem("theme", nextTheme);
  });
});
