import type { Translations } from "./en";

const es: Translations = {
  "common": {
    "loading": "Cargando...",
    "cancel": "Cancelar",
    "save": "Guardar",
    "saving": "Guardando...",
    "edit": "Editar",
    "delete": "Eliminar",
    "error": "Algo salió mal.",
    "copy": "Copiar",
    "copied": "Copiado",
    "language": "Idioma",
    "close": "Cerrar",
    "confirm": "Confirmar",
    "dismiss": "Cerrar"
  },
  "install": {
    "cta": "Instalar app",
    "ios": {
      "title": "Instalar friendflow",
      "subtitle": "Añadir a tu pantalla de inicio",
      "step1": "Pulse el botón Compartir en Safari",
      "step2": "Desplazarse y pulsar “Añadir a la pantalla de inicio”",
      "step3": "Pulsa “Añadir” para terminar"
    }
  },
  "theme": {
    "aria": "Tema de color",
    "mode": "Modo de visualización",
    "accent": "Color de acento",
    "accentAria": "Color de acento",
    "light": "Claro",
    "dark": "Oscuro",
    "system": "Sistema",
    "accents": {
      "indigo": "Indigo",
      "ocean": "Océano",
      "emerald": "Esmeralda",
      "rose": "Rubí",
      "lavender": "Lavanda",
      "sky": "Azul cielo",
      "peach": "Melocotón",
      "pink": "Rosa"
    },
    "headerIcon": {
      "title": "Icono del encabezado",
      "subtitle": "Muestra el icono de friendflow junto al nombre en el encabezado de la app."
    }
  },
  "layout": {
    "signOut": "Cerrar sesión",
    "account": "Cuenta",
    "settings": "Ajustes",
    "admin": "Admin",
    "adminWithPending": "Admin ({{count}} pendiente)",
    "menu": "Menú",
    "personalCalendar": "Mi calendario",
    "personalShopping": "Mis compras",
    "personalTasks": "Mis tareas",
    "dashboard": "Dashboard",
    "backToDashboard": "Volver a la vista general",
    "footer": "friendflow - autoalojado para ti y tu gente"
  },
  "mobileNav": {
    "aria": "Navegación primaria",
    "home": "Inicio",
    "calendar": "Calendario",
    "shopping": "Compras",
    "tasks": "Tareas",
    "account": "Cuenta",
    "settings": "Ajustes"
  },
  "notFound": {
    "title": "No se encontró",
    "subtitle": "Esta página no existe."
  },
  "legal": {
    "privacyPolicy": "Política de privacidad",
    "support": "Soporte",
    "accountDeletion": "Supresión de la cuenta",
    "termsOfService": "Términos de servicio",
    "backHome": "Inicio"
  },
  "instance": {
    "public": {
      "label": "Casos públicos",
      "hint": "cualquiera puede inscribirse"
    },
    "private": {
      "label": "Caso privado",
      "hint": "Aprobación de administración necesaria"
    }
  },
  "appUpdate": {
    "currentVersion": "Versión actual de la aplicación",
    "requiredVersion": "Versión requerida",
    "unknownVersion": "Desconocido",
    "checkIosAction": "Compruebe la App Store",
    "checkAndroidAction": "Compruebe la tienda de juegos",
    "reloadAction": "Reload app",
    "required": {
      "title": "Actualización necesaria",
      "body": "Este servidor ha sido actualizado y ya no admite la versión instalada de su aplicación. Actualice la aplicación para continuar."
    },
    "available": {
      "body": "Una versión de aplicación más nueva está disponible.",
      "pendingIos": "Está en camino una nueva versión de aplicación. Compruebe la App Store — si todavía no aparece, Apple probablemente todavía está revisando. Esto puede tardar un poco.",
      "pendingAndroid": "Está en camino una nueva versión de aplicación. Revisa la Play Store — si aún no aparece, Google probablemente todavía está revisando. Esto puede tardar un poco."
    }
  },
  "landing": {
    "nav": {
      "signIn": "Iniciar sesión",
      "signUp": "Empieza",
      "github": "GitHub"
    },
    "license": {
      "short": "AGPL-3.0",
      "tooltip": "Licenciado bajo la Licencia Pública General de Affero GNU v3.0"
    },
    "hero": {
      "eyebrow": "Una aplicación para tu grupo",
      "title": "Una base casera tranquila para tu tripulación.",
      "titlePhrases": [
        "Planea viajes juntos.",
        "Dividir los gastos bastante.",
        "Coordinar los horarios.",
        "Compartir listas de compras.",
        "Captura recuerdos.",
        "Viaja como tripulación."
      ],
      "subtitle": "Planear viajes, dividir gastos, alinear horarios, compartir listas de compras – todo con las mismas personas, en un lugar claro. También puede ejecutar friendflow en su propio servidor: sin seguimiento, sin anuncios, sus reglas.",
      "ctaPrimary": "Cree su cuenta",
      "ctaSecondary": "Ya tengo una cuenta.",
      "ctaGithub": "Ver fuente",
      "bullet1": "Grupos, viajes y gastos ilimitados",
      "bullet2": "Funciona en línea en su teléfono (PWA)",
      "bullet3": "Sus datos permanecen en su servidor",
      "bullet4": "Inglés & alemán construido en"
    },
    "mock": {
      "trip": {
        "title": "Semana de Lisboa",
        "subtitle": "Jun 7 - Jun 10 - 5 people"
      },
      "split": {
        "title": "Cena @ Hora Fuera Mercado",
        "subtitle": "Anna pagó - 4 acciones"
      },
      "calendar": {
        "title": "Pickup desde el aeropuerto",
        "subtitle": "Fri 16:40 - Tom"
      },
      "shopping": {
        "title": "Cultivos para pisos",
        "subtitle": "6 objetos abiertos"
      }
    },
    "trust": {
      "privacy": "Privacy-first",
      "selfHosted": "Self-hosted",
      "pwa": "Aplicación instalada",
      "multiLang": "5 idiomas"
    },
    "features": {
      "eyebrow": "Lo que consigues",
      "title": "Cuatro herramientas que trabajan juntas.",
      "subtitle": "Cada característica vive dentro de un grupo, así que la misma gente con la que dividiste la cuenta también puede ver el plan de viaje, el calendario compartido y la lista de compras.",
      "splitwise": {
        "title": "Gastos compartidos",
        "body": "Log que pagó por qué, se dividió desigualmente, se estableció en un grifo. Configuración multicurrencia y por grupo incluidos."
      },
      "trips": {
        "title": "Planificación de viajes",
        "body": "Planifique múltiples viajes por grupo. Recoger enlaces, construir un itinerario día a día, mantener una lista de embalaje compartida y ver todo en el calendario."
      },
      "calendar": {
        "title": "Calendario de grupos",
        "body": "Vistas del mes y de la agenda, compartidas con todos en el grupo. Las entradas itinerarias de viaje aparecen aquí automáticamente."
      },
      "shopping": {
        "title": "Listas de compras",
        "body": "Listas en tiempo real para el apartamento o el próximo viaje. Comprueba las cosas juntos sin gritar a través de la cocina."
      },
      "tasks": {
        "title": "Tareas compartidas",
        "body": "Divvy up chores and recands in the flat. Asignar personas, establecer las fechas y prioridades debidas - no más notas adhesivas pasivas-agresivas."
      }
    },
    "tour": {
      "eyebrow": "Un vistazo dentro",
      "title": "Vea friendflow en el trabajo.",
      "subtitle": "Cada herramienta, en bocetos de una pantalla. Estas burlas se hacen en vivo en la página - lo que ves es lo que obtienes una vez que te registras.",
      "you": "Tú.",
      "splitwise": {
        "eyebrow": "Gastos compartidos",
        "body": "Balanzas, transferencias sugeridas y una historia completa de quién pagó por qué - en una opinión, por grupo.",
        "b1": "Saldos vivos para cada miembro",
        "b2": "Arreglo simplificado o directo, su elección",
        "b3": "Transferencias de discos, establecerse en un grifo",
        "balanceLabel": "Su saldo",
        "suggestLabel": "Transferencias sugeridas",
        "graphLabel": "Gráfico del flujo de efectivo",
        "modeSimplified": "Simplificado",
        "modeDirect": "Direct"
      },
      "trips": {
        "eyebrow": "Planificación de viajes",
        "body": "Recoger enlaces, construir un itinerario día a día, mantener un ojo en el presupuesto - un espacio de trabajo de viaje completo para el grupo.",
        "b1": "Día a día itinerario con tiempos",
        "b2": "Junta de enlace con vistas y votos",
        "b3": "Presupuesto vinculado al libro mayor del grupo",
        "day1": "Fri, Jun 7",
        "day2": "Sat, Jun 8",
        "item1": "Recogida en el aeropuerto",
        "item2": "Check-in Airbnb",
        "item3": "Crucero portuario",
        "item4": "Cena @ Hora de salir",
        "budgetLabel": "Presupuesto de viaje"
      },
      "calendar": {
        "eyebrow": "Calendario de grupos",
        "body": "Vistas del mes y de la agenda, compartidas con todos en el grupo. Las entradas itinerarias de viaje aparecen aquí automáticamente.",
        "b1": "Mes, semana y opiniones del programa",
        "b2": "Eventos todo el día y tiempo",
        "b3": "Entradas de viaje realizadas automáticamente",
        "month": "Junio 2026",
        "hint": "Pulse un día para detalles",
        "d1": "Mo",
        "d2": "Tu",
        "d3": "Nosotros",
        "d4": "Th",
        "d5": "Fr.",
        "d6": "Sa",
        "d7": "Su",
        "eventDay": "Sat, Jun 20",
        "eventTitle": "Fiesta de verano en Luca",
        "eventDay2": "Sat, Jun 8",
        "eventTitle2": "Crucero portuario",
        "fromTrip": "Viaje"
      },
      "shopping": {
        "eyebrow": "Lista de compras",
        "body": "Listas en tiempo real para el apartamento o el próximo viaje. Comprueba las cosas juntos sin gritar a través de la cocina.",
        "b1": "Todo el mundo ve las actualizaciones al instante",
        "b2": "Asignar, o dejar abierta para quien vaya primero",
        "b3": "Borrar los elementos completados en un grifo",
        "openCount_one": "{{count}} elemento abierto",
        "openCount_other": "{{count}} elementos abiertos",
        "live": "Vivir",
        "open": "abierto",
        "i1": "Milk",
        "i2": "Pan",
        "i3": "Café",
        "i4": "Papas",
        "i5": "Avocados"
      },
      "tasks": {
        "eyebrow": "Tareas compartidas",
        "body": "Dividir las tareas y los recados en el piso. Asignar a la gente, fijar las fechas, seguir las prioridades - y ver quién finalmente hizo los platos.",
        "b1": "Asignar tareas a cualquier miembro del grupo",
        "b2": "Fechas con retraso / hoy / chips pronto",
        "b3": "Prioridades para mantener visible el material urgente",
        "t1": "Limpiar el baño",
        "t2": "Saca la basura.",
        "t3": "Ordene nuevas esponjas",
        "t4": "Vacía el lavavajillas",
        "priHigh": "Alto",
        "priLow": "Baja",
        "dueToday": "Hoy",
        "dueTomorrow": "Mañana",
        "dueWeek": "En 4 días",
        "assigned": "Asignado a {{name}}",
        "doneBy": "Hecho por {{name}}"
      }
    },
    "how": {
      "eyebrow": "Cómo funciona",
      "title": "Tres pasos para que tu grupo vaya.",
      "subtitle": "Crear un grupo, invitar a tu gente, abrir las herramientas que necesitas – sin desvíos, sin desorden.",
      "step1": {
        "title": "Crear un grupo",
        "body": "Un grupo es un círculo de amigos - un piso, un equipo, un viaje. Dilo, establece una moneda, hecha."
      },
      "step2": {
        "title": "Invita a tu gente",
        "body": "Compartir un código, enlace o código QR. Sin cadenas de correo electrónico, sin spam."
      },
      "step3": {
        "title": "Abrir las herramientas",
        "body": "Elige los que necesites - gastos, viajes, calendario, compras. Todo lo demás se queda fuera de la vista."
      }
    },
    "values": {
      "eyebrow": "Control de confianza",
      "title": "Construido para el largo recorrido.",
      "subtitle": "friendflow está abierto, software honesto. Sin cuentas que no puedes eliminar, sin análisis viendo cada grifo.",
      "privacy": {
        "title": "Sus datos, sus reglas",
        "body": "No hay SaaS central. La instancia en la que te registras es en la que elegiste confiar."
      },
      "selfHosted": {
        "title": "Corre a cualquier lugar",
        "body": "Dos contenedores por docker-compose. Un pequeño VPS es más que suficiente para un grupo de amigos.",
        "cta": "Fuente en GitHub"
      },
      "pwa": {
        "title": "Pantalla de inicio lista",
        "body": "Instala como aplicación en iOS y Android. Se siente nativo, se actualiza."
      },
      "open": {
        "title": "Sin bloqueo.",
        "body": "Postgres estándar debajo - sus datos son suyos, exportables e inspeccionables."
      }
    },
    "faq": {
      "eyebrow": "FAQ",
      "title": "Preguntas, brevemente contestadas.",
      "subtitle": "¿Algo más? Pregúntele a quien dirige este caso.",
      "cost": {
        "q": "¿Qué cuesta?",
        "a": "friendflow es libre. Sólo pagas por el pequeño servidor en el que lo ejecutas - a menudo unos pocos euros al mes."
      },
      "data": {
        "q": "¿Dónde están mis datos almacenados?",
        "a": "En el servidor exacto cuya URL está leyendo ahora mismo. Nada se envía a un tercero."
      },
      "mobile": {
        "q": "¿Hay una aplicación móvil?",
        "a": "Sí - el sitio web se instala como una aplicación web progresiva en iOS y Android. No se necesita una tienda de aplicaciones."
      },
      "invite": {
        "q": "¿Mis amigos necesitan una cuenta?",
        "a": "Se registran con un correo electrónico y contraseña en este caso. Todo el mundo se queda dentro del grupo te invita a compartir."
      }
    },
    "finalCta": {
      "title": "¿Listo para dejar de hacer malabares cinco aplicaciones de chat?",
      "subtitle": "Comience un grupo, invite a su equipo y mantenga el próximo viaje, cena y decisión plana en un lugar tranquilo.",
      "ctaPrimary": "Cree su cuenta",
      "ctaSecondary": "Iniciar sesión"
    }
  },
  "auth": {
    "login": {
      "title": "Iniciar sesión",
      "subtitle": "Bienvenido.",
      "submit": "Iniciar sesión",
      "submitting": "Firmando...",
      "noAccount": "¿Todavía no tiene cuenta?",
      "register": "Regístrate",
      "failed": "Login fallido",
      "forgotPassword": "¿Olvidó la contraseña?"
    },
    "register": {
      "title": "Crear cuenta",
      "subtitle": "Toma 30 segundos.",
      "submit": "Regístrate",
      "submitting": "Crear cuenta...",
      "hasAccount": "¿Ya tienes una cuenta?",
      "login": "Iniciar sesión",
      "passwordHint": "Al menos 8 caracteres.",
      "failed": "El registro falló"
    },
    "forgot": {
      "title": "Restablecer su contraseña",
      "subtitle": "Introduzca su correo electrónico y le enviaremos un enlace para elegir una nueva contraseña.",
      "submit": "Enviar enlace de restablecimiento",
      "submitting": "Enviando...",
      "failed": "No podría enviar el enlace de reseteo",
      "backToLogin": "Volver a iniciar sesión",
      "sentTitle": "Revisa tu buzón de entrada",
      "sentBody": "Si una cuenta existe para ese correo electrónico, acabamos de enviar un enlace para restablecer su contraseña.",
      "sentHint": "El enlace es válido durante 1 hora. No te olvides de revisar tu carpeta de spam."
    },
    "reset": {
      "title": "Elija una nueva contraseña",
      "subtitle": "Escoge algo que recordarás - al menos 8 caracteres.",
      "newPassword": "Nueva contraseña",
      "confirmPassword": "Confirme nueva contraseña",
      "submit": "Guardar nueva contraseña",
      "submitting": "Salvando...",
      "failed": "No se puede restablecer la contraseña",
      "errorShort": "La contraseña debe ser por lo menos 8 caracteres.",
      "errorMismatch": "Las dos contraseñas no coinciden.",
      "doneTitle": "Contraseña actualizada",
      "doneBody": "Puedes iniciar sesión con tu nueva contraseña ahora.",
      "goToLogin": "Iniciar sesión",
      "invalidTitle": "Enlace de reajuste inválido",
      "invalidBody": "Este enlace falta una ficha o ya no es válido. Pida una nueva para continuar.",
      "requestNew": "Solicitar un nuevo enlace"
    },
    "fields": {
      "email": "Email",
      "password": "Contraseña",
      "displayName": "Nombre de visualización"
    },
    "instance": {
      "title": "Elija la instancia",
      "subtitle": "Mantenga la sesión simple por defecto, o apunte la aplicación en su propio servidor friendflow privado.",
      "switchAction": "Otras instancias",
      "currentAction": "Instance: {{label}}",
      "activeLabel": "Caso actual",
      "defaultHint": "El objetivo de inicio de sesión de la aplicación estándar.",
      "defaultSelected": "Seleccionado",
      "useDefault": "Use {{label}}",
      "customLabel": "Privada / propia instancia",
      "customHint": "Introduzca la URL de la raíz pública de su instalación friendflow.",
      "useCustom": "Use esta instancia",
      "validating": "Por ejemplo...",
      "invalidUrl": "Introduzca una URL de instancia válida. Use https:// para servidores remotos.",
      "unreachable": "Este caso no puede ser alcanzado o no parece un servidor friendflow compatible.",
      "customAcknowledgement": "Entiendo que este caso puede ser operado por otra persona, y que su política de privacidad, el contacto de apoyo y el proceso de eliminación de cuentas se aplican allí.",
      "ackRequired": "Confirme el aviso de instancia personalizada antes de cambiar."
    }
  },
  "pending": {
    "title": "Esperando aprobación",
    "body": "Tu cuenta ha sido creada. Un administrador necesita aprobarlo antes de que usted pueda firmar.",
    "hint": "Pídale a la persona que ejecute este caso que apruebe su cuenta - usted será capaz de firmar después.",
    "loginLink": "Volver a iniciar sesión"
  },
  "account": {
    "title": "Ajustes y cuenta",
    "subtitle": "Gestiona tus preferencias, perfil, seguridad y acceso a la app.",
    "profile": {
      "title": "Perfil",
      "subtitle": "Cambia el nombre que ven las demás personas de tus grupos.",
      "submit": "Guardar perfil",
      "saved": "Perfil actualizado.",
      "errors": {
        "displayNameShort": "El nombre de la pantalla debe ser por lo menos 2 caracteres."
      }
    },
    "preferences": {
      "title": "Apariencia e idioma",
      "subtitle": "Personalice cómo se ve friendflow y qué idioma utiliza en este dispositivo."
    },
    "access": {
      "title": "App y acceso",
      "subtitle": "Gestiona el acceso a la app y tu sesión actual."
    },
    "password": {
      "title": "Contraseña",
      "subtitle": "Cambia tu contraseña sin dejar la aplicación.",
      "current": "Contraseña actual",
      "submit": "Cambiar contraseña",
      "saved": "Contraseña actualizada."
    },
    "delete": {
      "title": "Suprimir la cuenta",
      "subtitle": "Eliminar permanentemente esta cuenta de esta instancia.",
      "warning": "Esto no puede ser deshecho. Los datos personales solo se eliminan automáticamente. La historia del grupo compartido puede permanecer con una etiqueta de usuario eliminado para que el grupo permanezca usable para otros miembros.",
      "password": "Contraseña actual",
      "submit": "Suprimir la cuenta",
      "confirmTitle": "Eliminar esta cuenta?",
      "confirmBody": "Esto desactiva permanentemente su registro en este caso, elimina los datos solo personal y deja anonimato la historia del grupo compartido cuando sea necesario.",
      "deleted": "Se suprimió la cuenta.",
      "errors": {
        "passwordRequired": "Introduzca su contraseña actual para eliminar esta cuenta."
      }
    },
    "about": {
      "title": "Acerca de y aspectos legales",
      "subtitle": "friendflow {{version}}"
    }
  },
  "dashboard": {
    "eyebrow": "Tus grupos",
    "greeting": "Hey {{name}} - elegir un grupo",
    "subtitle": "Un grupo es su círculo amigo (flat, trip, tripulación, ...). Cada grupo tiene sus propios miembros y herramientas.",
    "yourGroups": "Grupos",
    "personalTools": "Para ti",
    "personalCalendarDescription": "Eventos privados que sólo usted ve - independiente de cualquier grupo.",
    "personalShoppingDescription": "Las listas de compras privadas sólo se ven, además de una rápida visión general de las listas de cada grupo.",
    "personalTasksDescription": "Privado todos más cada tarea de grupo asignada a usted - todo en un lugar.",
    "open": "Abierto",
    "shortcutsTitle": "Atajos",
    "shortcutsHint": "Añadir herramientas de un grupo con el botón estrella.",
    "groupOverview": "Sinopsis del Grupo",
    "join": "Únase",
    "newGroup": "Nuevo grupo",
    "memberCount_one": "{{count}} miembro",
    "memberCount_other": "Miembros de {{count}}",
    "inviteCode": "Invitar código",
    "inviteClosed": "cerrado",
    "roleOwner": "Propietario",
    "empty": {
      "title": "Todavía no hay grupos",
      "description": "Crear un grupo para su apartamento, un viaje o su equipo regular - o unirse con un código de invitación. Aún puedes usar herramientas personales por tu cuenta."
    },
    "onboarding": {
      "title": "Comience a su ritmo",
      "description": "Estos pasos son sólo sugerencias. Puede cerrar esto y seguir utilizando cada parte de friendflow.",
      "profile": "Cuenta lista",
      "group": "Crear o unirse a un grupo",
      "tool": "Añadir un primer atajo",
      "dismiss": "Oculto"
    },
    "create": {
      "title": "Nuevo grupo",
      "name": "Nombre",
      "namePlaceholder": "e.g. Flat kitty",
      "currency": "Moneda",
      "submit": "Crear",
      "created": "\"{{name}}\" creado."
    },
    "joinForm": {
      "title": "Join group",
      "code": "Invitar código",
      "codePlaceholder": "ABC12345",
      "submit": "Únase",
      "joined": "Se unió a \"{{name}}\"."
    },
    "googleCalendarTitle": "Google Calendar",
    "googleCalendarDescription": "Sincronización de viajes y eventos de calendario en su calendario de Google."
  },
  "integrations": {
    "googleCalendar": {
      "title": "Google Calendar",
      "subtitle": "Cuando está conectado, guarda en Friendflow Actualización eventos coincidentes en su Google Calendar (friendflow mantiene la fuente de la verdad).",
      "softReadOnly": "Los cambios que haga sólo en Google Calendar pueden ser sobrescritos la próxima vez que guarde algo en Friendflow.",
      "statusConnected": "Conectado",
      "statusDisconnected": "No conectado",
      "connect": "Conectar Google Calendar",
      "disconnect": "Desconexión",
      "connectedToast": "Google Calendar conectado.",
      "disconnectedToast": "Desconectado de Google Calendar."
    }
  },
  "group": {
    "backToGroups": "Grupos",
    "members_one": "{{count}} miembro",
    "members_other": "Miembros de {{count}}",
    "tools": "Herramientas",
    "groupOverview": "Sinopsis del Grupo",
    "toolSwitcherLabel": "Herramientas {{name}}",
    "open": "Abierto",
    "experimental": "Experimental",
    "membersTitle": "Miembros",
    "joined": "se unió a {{date}}",
    "removeMember": "Eliminar miembro",
    "removeMemberAria": "Quitar {{name}} del grupo",
    "removeMemberTitle": "¿Retirar miembro?",
    "removeMemberConfirm": "Quitar \"{{name}}\" de \"{{group}}\"? Perderán el acceso a este grupo y sus herramientas hasta que se junten con una nueva invitación.",
    "removeMemberDone": "{{name}} fue eliminado del grupo.",
    "inviteCode": "Invitar código",
    "copyCode": "Copiar código",
    "inviteLink": "Invitar enlace",
    "copyLink": "Copiar el enlace",
    "share": "Compartir",
    "showQr": "Mostrar código QR",
    "hideQr": "Ocultar código QR",
    "qrHint": "Escanear para unirse a este grupo.",
    "shareText": "Únase a mi grupo \"{{name}}\" en friendflow",
    "inviteHint": "Compartir el código, enlace o QR con cualquiera que desee añadir a este grupo.",
    "invitesOpen": "Abierto",
    "invitesClosed": "Los invitados están cerrados.",
    "invitesClosedBadge": "Cerrado",
    "invitesClosedOwnerHint": "Nadie puede unirse ahora mismo. Abra invitaciones para generar un código nuevo que pueda compartir.",
    "invitesClosedMemberHint": "Sólo el propietario del grupo puede abrir invitaciones. Pídeles que generen un nuevo código.",
    "openInvites": "Invitaciones abiertas",
    "closeInvites": "Cerrar invitaciones",
    "closeInvitesTitle": "¿Invitaciones cercanas?",
    "closeInvitesConfirm": "¿Cerrar invitaciones para \"{{name}}\"? El código actual y el enlace dejan de funcionar inmediatamente. Puede reabrir cualquier tiempo (se generará un nuevo código).",
    "regenerate": "Nuevo código",
    "regenerateTitle": "¿ Generar un nuevo código?",
    "regenerateConfirm": "El código actual y el enlace dejarán de funcionar inmediatamente. Una nueva se genera inmediatamente.",
    "delete": "Grupo Suprímase",
    "deleteHint": "Elimina permanentemente el grupo y todos sus datos de herramientas.",
    "deleteTitle": "¿Supir grupo?",
    "deleteConfirm": "¿De verdad eliminar \"{{name}}\" y todos sus datos?",
    "leave": "Grupo de hojas",
    "leaveHint": "Dejarás de ver a este grupo en tu tablero. Reúnete en cualquier momento con una nueva invitación.",
    "leaveTitle": "¿Un grupo?",
    "leaveConfirm": "¿Deja \"{{name}}\"? Necesitarás una nueva invitación para volver.",
    "ownerActionsHint": "Como propietario puede eliminar el grupo. Dejar las transferencias de propiedad al próximo miembro.",
    "more": {
      "title": "Más herramientas pronto",
      "description": "Estamos trabajando en nuevas herramientas para tu grupo. ¡No te muevas!"
    },
    "toolFavorite": {
      "add": "Añadir a casa",
      "remove": "Quitar de casa"
    }
  },
  "tools": {
    "splitwise": {
      "name": "Ledger",
      "description": "Gastos compartidos para este grupo - track who paid what, see balances and suggested settlements."
    },
    "trips": {
      "name": "Tripboard",
      "description": "Recoger enlaces de viaje (Airbnb, Reserva, entradas de blog, ...). Cada enlace obtiene una tarjeta de vista previa que todos pueden ver de un vistazo."
    },
    "calendar": {
      "name": "Calendario",
      "description": "Eventos compartidos para este grupo - reuniones, viajes, cumpleaños. Mira lo que viene de un vistazo."
    },
    "shopping": {
      "name": "Lista de compras",
      "description": "Una simple lista compartida. Cualquier persona en el grupo puede añadir y marcar los elementos."
    },
    "tasks": {
      "name": "Tareas",
      "description": "Una lista compartida de todo - dividir las tareas y los recados para el piso, asignarlos a los miembros y fijar las fechas debidas."
    },
    "games": {
      "name": "Juegos",
      "description": "Gire una rueda para elegir a alguien al azar, o planifique un torneo de puntos o nocaut con equipos opcionales."
    }
  },
  "splitwise": {
    "overview": {
      "backToGroup": "Volver al grupo",
      "title": "Ledger",
      "members_one": "{{count}} miembro",
      "members_other": "Miembros de {{count}}",
      "addExpense": "Gastos",
      "yourBalance": "Su saldo",
      "positive": "Te deben dinero.",
      "negative": "Le debes dinero al grupo.",
      "zero": "Todo está arreglado.",
      "balances": "Saldos",
      "you": "Tú",
      "settlementsTitle": "Sugerencia: cómo establecerse",
      "allSettled": "Todo el mundo es cuadrado - nada para transferir.",
      "viewAria": "Solución",
      "viewList": "Lista",
      "viewGraph": "Gráfico",
      "modeAria": "Modo de solución",
      "modeSimplified": "Simplificado",
      "modeSimplifiedHint": "Número mínimo de transferencias. Alguien puede pagar a una persona que nunca debe directamente.",
      "modeDirect": "Direct",
      "modeDirectHint": "Sólo paga a la gente que realmente debes. Deudas entre el mismo par cancelar.",
      "graph": {
        "aria": "Gráfico del flujo de efectivo",
        "settled": "Nada que mostrar - todo el mundo está arreglado.",
        "onlyOne": "{{name}} es la única persona con un equilibrio abierto."
      },
      "expenses": "Gastos",
      "noExpenses": "Todavía no hay gastos. ¡Añada la primera!",
      "paidBy": "pagado por {{name}}",
      "youLent": "prestado {{amount}}",
      "youBorrowed": "prestado {{amount}}",
      "selfPaid": "sólo para ti",
      "notInvolved": "no involucrados",
      "breakdown": "Desglose",
      "deleteTitle": "Eliminar gastos?",
      "deleteConfirm": "¿De verdad eliminar el gasto \"{{description}}\"?",
      "deleteTooltip": "Suprimir",
      "deleteAria": "Suprimir gastos",
      "editTooltip": "Editar",
      "editAria": "Gastos de edición",
      "recordPayment": "Pago récord",
      "settleUp": "Cálmate.",
      "markPaid": "Marcas pagadas",
      "paymentSettlementHint": "Ya he transferido esto.",
      "history": "Actividad",
      "noActivity": "Todavía no hay actividad.",
      "paymentTitle": "{{from}} pagó {{to}}",
      "paymentYouPaid": "Usted pagó {{name}}",
      "paymentYouReceived": "{{name}} te pagó",
      "paymentDeleteTitle": "Eliminar el pago?",
      "paymentDeleteConfirm": "¿Realmente eliminar este pago?",
      "paymentDeleteAria": "Suprimir el pago",
      "forTrip": "Para el viaje: {{name}}",
      "forTripTooltip": "Este gasto cuenta con el presupuesto del viaje."
    },
    "payment": {
      "title": "Pago récord",
      "subtitle": "Inicie un traslado entre dos miembros.",
      "from": "Desde",
      "to": "A",
      "amount": "Cantidad ({{currency}})",
      "note": "Nota (opcional)",
      "notePlaceholder": "por ejemplo, transferencia bancaria, PayPal, efectivo",
      "date": "Fecha",
      "submit": "Salvo",
      "submitting": "Salvando...",
      "errorInvalidAmount": "Por favor, introduzca una cantidad válida.",
      "errorSameUser": "El remitente y el destinatario deben ser diferentes."
    },
    "newExpense": {
      "back": "Volver al libro mayor",
      "title": "Nuevos gastos",
      "editTitle": "Gastos de edición",
      "description": "Descripción",
      "descriptionPlaceholder": "por ejemplo Pizza anoche",
      "amount": "Cantidad ({{currency}})",
      "paidBy": "Pagado",
      "split": "Split",
      "modeEqual": "Igualdad",
      "modeExact": "Exacto",
      "sum": "Sum: {{amount}}",
      "matches": "coincidencias",
      "difference": "Diferencia {{amount}}",
      "errorInvalidAmount": "Por favor, introduzca una cantidad válida.",
      "errorSumMismatch": "Suma de divisiones ({{sum}}) no coincide con la cantidad ({{amount}}).",
      "errorNoParticipants": "Al menos una persona debe participar.",
      "submit": "Guardar",
      "submitting": "Salvando...",
      "trip": "Viaje asociado",
      "tripNone": "Sin viaje (gasto del grupo general)",
      "tripHint": "Elija un viaje para que este gasto cuente hacia el presupuesto de ese viaje."
    }
  },
  "trips": {
    "list": {
      "title": "Tripboard",
      "subtitle": "Todos los viajes previstos en este grupo.",
      "bannerTitle": "Múltiples viajes por grupo",
      "bannerBody": "Cree un viaje separado para cada vacaciones. Cada viaje tiene sus propios enlaces, itinerario, lista de embalaje y presupuesto.",
      "newTrip": "Nuevo viaje",
      "emptyTitle": "Todavía no hay viajes",
      "emptyHint": "Añade tu primer viaje, por ejemplo, 'Lisboa en mayo'. Puedes rellenar los destinos y fechas más tarde.",
      "createFirst": "Crear primer viaje",
      "create": "Crear viaje",
      "nameLabel": "Nombre del viaje",
      "namePlaceholder": "por ejemplo, Lisboa en mayo",
      "datesHint": "Las fechas son opcionales - puede cambiarlas más tarde en la pestaña Información.",
      "deleted": "Viaje eliminado.",
      "deleteTitle": "Eliminar el viaje?",
      "deleteConfirm": "Eliminar '{{name}}' incluyendo todos sus enlaces, entradas itinerarias y artículos de embalaje?",
      "delete": "Eliminar el viaje",
      "noDates": "No hay fechas establecidas",
      "noDestinations": "No hay destinos",
      "status": {
        "upcoming": "Subiendo",
        "ongoing": "Continuando",
        "past": "Pasado",
        "unscheduled": "No programado"
      }
    },
    "detail": {
      "backToList": "Todos los viajes",
      "infoNeeded": "Añada su destino y fechas aquí primero."
    },
    "overview": {
      "backToGroup": "Volver al grupo",
      "title": "Tripboard",
      "subtitle": "Enlaces que el grupo está considerando.",
      "add": "Agregar enlace",
      "addTitle": "Agregar un enlace",
      "newFolder": "Nueva carpeta",
      "unsorted": "Unsorted",
      "url": "URL",
      "noteOptional": "Nota (opcional)",
      "notePlaceholder": "¿Qué hace esto interesante?",
      "addNote": "Añadir una nota",
      "editNote": "Edita tu nota",
      "refresh": "Previsión de referencia",
      "like": "Como",
      "dislike": "No me gusta",
      "deleteTitle": "¿Retirar el enlace?",
      "deleteConfirm": "Quitar este enlace de la tabla de viaje?",
      "addedBy": "Añadido por {{name}} en {{date}}",
      "empty": {
        "title": "Todavía no hay enlaces",
        "description": "Pruebe un Airbnb, enlace de reserva o blog - la vista previa se recoge automáticamente."
      },
      "folder": {
        "label": "Folder",
        "addTitle": "Nueva carpeta",
        "name": "Nombre de carpeta",
        "namePlaceholder": "e.g. Airbnbs, Vuelos, Restaurantes",
        "create": "Crear carpeta",
        "rename": "Rename",
        "renameAria": "Carpeta de nombre",
        "delete": "Eliminar la carpeta",
        "deleteAria": "Eliminar la carpeta",
        "deleteTitle": "¿Descargar la carpeta?",
        "deleteConfirm": "Eliminar la carpeta \"{{name}}\"? Sus enlaces regresan a \"Unsorted\".",
        "empty": "Aún no hay enlaces en esta carpeta.",
        "moveAria": "Mover a la carpeta",
        "expand": "Ampliar la carpeta",
        "collapse": "Carpeta de colapso",
        "addLink": "Agregar enlace a esta carpeta",
        "addLinkAria": "Agregar enlace a \"{{name}}\""
      },
      "duplicateTitle": "¿Ya está en el tablero?",
      "duplicateConfirm": "Este enlace ya está en el tablero. ¿Otra vez?",
      "duplicateAdd": "Agregar de todos modos",
      "duplicateHint": "Este enlace ya está en el tablero.",
      "unfurlEmpty": "No está cargado.",
      "retryUnfurl": "Previsión de entrada",
      "overrideManually": "Anule manualmente",
      "overrideTitle": "Título (overrides vista previa)",
      "overrideTitlePlaceholder": "Título de aduana",
      "overrideImage": "URL de imagen (overrides vista previa)",
      "overrideHint": "Deja en blanco para volver al valor auto-comparado.",
      "refreshDone": "Vista previa actualizada.",
      "refreshEmpty": "No se ha encontrado ningún contenido nuevo.",
      "widgets": {
        "openTab": "Abierto",
        "noDates": "No hay fechas todavía",
        "noDestinations": "Todavía no hay destinos",
        "links": {
          "empty": "Todavía no hay enlaces añadidos.",
          "count_one": "{{count}} enlace en total",
          "count_other": "Enlaces {{count}} en total"
        },
        "itinerary": {
          "empty": "Nada planeado aún.",
          "count_one": "Entrada {{count}} en total",
          "count_other": "Entradas {{count}} en total"
        },
        "packing": {
          "empty": "La lista de embalaje sigue vacía.",
          "progress": "{{done}} de {{total}} empacado",
          "allPacked": "Todos empaquetados",
          "count_one": "{{count}} todavía para empacar",
          "count_other": "{{count}} todavía para empacar"
        },
        "budget": {
          "title": "Presupuesto",
          "empty": "No hay conjunto de presupuesto todavía - añadir uno en Info.",
          "remaining": "{{amount}} izquierda",
          "over": "{{amount}} sobre el presupuesto"
        }
      }
    },
    "tabs": {
      "ariaLabel": "Secciones de planificador de viaje",
      "overview": "Sinopsis",
      "links": "Enlaces",
      "itinerary": "Itinerario",
      "packing": "Lista de embalaje",
      "info": "Info"
    },
    "info": {
      "bannerTitle": "La fundación de este viaje",
      "bannerBody": "Nombre, fechas, destinos y presupuesto para este viaje aquí. Estos valores impulsan el diseño del día itinerario y el widget del presupuesto (enlazado a la herramienta Splitwise del grupo).",
      "nameTitle": "Viaje",
      "rename": "Rename",
      "renameHint": "Pulse Enter para guardar el nuevo nombre.",
      "renamed": "Trip renombrado.",
      "deleteTrip": "Eliminar el viaje",
      "deleteTitle": "Eliminar el viaje?",
      "deleteConfirm": "Eliminar '{{name}}' incluyendo todos sus enlaces, entradas itinerarias y artículos de embalaje?",
      "budgetFromAssigned": "Sólo cuenta los gastos que fueron asignados explícitamente a este viaje.",
      "datesTitle": "Fechas de viaje",
      "startDate": "Llegada",
      "endDate": "Salida",
      "datesHint": "Opcional. Cuando se establece, la lista de embalaje obtiene una cuenta regresiva y el itinerario se divide en días automáticamente.",
      "setupNudgeDates": "Agregue por lo menos una fecha aquí, o agregue un destino a continuación, ahorre, para aclarar el recordatorio en la pestaña Información.",
      "setupNudgeDestinations": "Añadir por lo menos un lugar aquí, o establecer fechas arriba — luego guardar— para aclarar el recordatorio en la pestaña Información.",
      "destinationsTitle": "Destinos",
      "addDestination": "Agregar destino",
      "destinationsEmpty": "Todavía no hay destinos.",
      "destinationsHint": "Las coordenadas son opcionales - sin ellas buscamos por nombre en Google Maps / OSM.",
      "destinationName": "Lugar",
      "destinationNamePlaceholder": "por ejemplo, Lisboa",
      "lat": "Lat",
      "lng": "Lng",
      "openInGoogleMaps": "Abrir en Google Maps",
      "openInOsm": "Abra en OpenStreetMap",
      "budgetTitle": "Presupuesto",
      "budgetLabel": "Presupuesto de viaje ({{currency}})",
      "budgetPlaceholder": "p. ej. 1500",
      "budgetEmptyHint": "No hay presupuesto. Una vez que entre en uno, progreso vs. El gasto de Splitwise aparece aquí.",
      "budgetSpent": "Gasto",
      "budgetRemaining": "Permanecer: {{amount}}",
      "budgetOverBy": "Sobre el presupuesto por {{amount}}",
      "saved": "Salvado.",
      "lastSavedAt": "Último {{time}}",
      "autosaving": "Salvando...",
      "errorDates": "La llegada no debe ser después de la salida.",
      "errorBudget": "El presupuesto debe ser un número positivo."
    },
    "packing": {
      "bannerTitle": "Lista de verificación compartida",
      "bannerBody": "Todo el grupo ve la misma lista y puede revisar los artículos. Categorías y cesionarios son opcionales - utilizarlos para dividir por ejemplo 'Tent' y 'Food'.",
      "title": "Lista de embalaje",
      "add": "Añadir",
      "empty": "Todavía no hay nada en la lista.",
      "emptyHint": "Tipo de artículos en - cantidad, categoría y cesionario son opcionales.",
      "progress": "{{done}}/{{total}} empacado ({{pct}}%)",
      "namePlaceholder": "por ejemplo, Pasaporte",
      "quantityPlaceholder": "Cantidad (opcional)",
      "quantityShort": "Qty",
      "categoryPlaceholder": "Categoría (opcional)",
      "categoryShort": "Categoría",
      "categoryNone": "Uncategorized",
      "assigneeNone": "Nadie asignado",
      "markPacked": "Marca como empaquetado",
      "markUnpacked": "Marca como no empaquetado",
      "deleteTitle": "Eliminar el tema?",
      "deleteConfirm": "Quitar '{{name}}' de la lista?",
      "catalog": {
        "open": "Propuestas",
        "close": "Ocultar sugerencias",
        "title": "Sospechosos habituales",
        "hint": "Toca todo para añadirlo a la lista. Los artículos ya añadidos están grisados.",
        "alreadyAdded": "Ya en la lista",
        "addedToast": "Añadido '{{name}}'",
        "addAll": "Añadir todo lo que falta",
        "categories": {
          "documents": "Documentos y dinero",
          "electronics": "Electrónica",
          "toiletries": "Artículos de higiene",
          "health": "Salud y primeros auxilios",
          "clothing": "Confección",
          "outdoor": "Camping al aire libre",
          "beach": "Playa y agua",
          "winter": "Tiempo frío",
          "misc": "Varios"
        },
        "items": {
          "passport": "Pasaporte",
          "idCard": "Tarjeta de identificación",
          "drivingLicense": "Licencia de conducir",
          "insuranceCard": "Tarjeta de seguro médico",
          "vaccinationRecord": "Registro de vacunación",
          "tickets": "Billetes",
          "bookingConfirmations": "Confirmaciones de reserva",
          "cash": "Efectivo",
          "creditCard": "Tarjeta de crédito/débito",
          "emergencyContacts": "Contactos de emergencia",
          "phoneCharger": "Cargador de teléfono",
          "chargingCable": "Cable de carga",
          "powerbank": "Banco de energía",
          "headphones": "Auriculares",
          "travelAdapter": "Adaptador de viajes",
          "camera": "Cámara",
          "laptop": "Laptop",
          "laptopCharger": "Cargador portátil",
          "ereader": "E-reader",
          "toothbrush": "Cepillo de dientes",
          "toothpaste": "Toothpaste",
          "shampoo": "Shampoo",
          "showerGel": "gel de ducha",
          "deodorant": "Deodorant",
          "razor": "Razor",
          "towel": "Towel",
          "brush": "Cepillo/comb",
          "sunscreen": "Pantalla solar",
          "periodProducts": "Tampons / pads",
          "contactLenses": "Lentes de contacto y líquido",
          "painkillers": "Dolores",
          "plasters": "Plasters",
          "personalMeds": "Medicamentos personales",
          "insectRepellent": "Repelente de insectos",
          "handSanitiser": "Sanitis de mano",
          "socks": "Socks",
          "underwear": "Ropa interior",
          "tshirts": "Camisetas",
          "trousers": "Trousers",
          "sweater": "Sweater",
          "rainJacket": "Chaqueta de lluvia",
          "pyjamas": "Pijamas",
          "sneakers": "Sneakers",
          "flashlight": "Linterna / faro",
          "pocketKnife": "Cuchillo de bolsillo",
          "waterBottle": "Botella de agua",
          "lighter": "Lighter",
          "trashBags": "Bolsas de basura",
          "swimwear": "Ropa interior",
          "flipflops": "Flip-flops",
          "beachTowel": "Toalla de playa",
          "sunglasses": "Gafas de sol",
          "hat": "Sombrero / gorra",
          "winterJacket": "Chaqueta de invierno",
          "gloves": "Guantes",
          "scarf": "Scarf",
          "beanie": "Beanie",
          "thermalLayer": "capa térmica",
          "sleepMask": "Máscara de sueño",
          "earplugs": "Earplugs",
          "toiletryBag": "Bolso de higiene",
          "reusableBag": "Bolsa reutilizable",
          "book": "Libro",
          "snacks": "Snacks"
        }
      }
    },
    "itinerary": {
      "bannerTitle": "Programa día a día",
      "bannerBody": "Agregar actividades, transferencias o reservas por día - con o sin tiempo. Calendario eventos del calendario del grupo aparecen automáticamente aquí cuando entran dentro del período de viaje.",
      "emptyTitle": "Sin itinerario todavía",
      "emptyHint": "Agregar actividades, transferencias o reservas - con o sin tiempos. Consejo: los eventos del calendario aparecen aquí automáticamente.",
      "addFirst": "Añadir la primera entrada",
      "addForDay": "Añadir entrada para este día",
      "dayEmpty": "Nada planeado para este día todavía.",
      "add": "Guardar entrada",
      "allDay": "Todo el día",
      "titlePlaceholder": "Por ejemplo, crucero por el puerto",
      "locationPlaceholder": "Ubicación (opcional)",
      "notePlaceholder": "Notas adicionales (opcional)",
      "startTime": "Comienzo",
      "endTime": "Final",
      "noLink": "No hay URL vinculada",
      "deleteTitle": "Eliminar la entrada?",
      "deleteConfirm": "Quitar '{{title}}' del itinerario?",
      "fromCalendar": "Del calendario",
      "openInCalendar": "Abierto en calendario",
      "sourceTrip": "Itinerario",
      "sourceCalendar": "Calendario"
    }
  },
  "calendar": {
    "overview": {
      "backToGroup": "Volver al grupo",
      "title": "Calendario",
      "subtitle": "Próximos eventos para este grupo.",
      "add": "Nuevo evento",
      "addTitle": "Nuevo evento",
      "editTitle": "Editar evento",
      "eventTitle": "Título",
      "eventTitlePlaceholder": "Por ejemplo, cena en Luca",
      "start": "Empieza",
      "startDate": "Fecha de inicio",
      "startTime": "Hora de inicio",
      "endOptional": "Finales (opcional)",
      "endDate": "Fecha final",
      "endTime": "Tiempo final",
      "allDay": "Todo el día",
      "location": "Ubicación",
      "locationPlaceholder": "Por ejemplo, la casa de Luca, Berlín",
      "descriptionOptional": "Descripción (opcional)",
      "descriptionPlaceholder": "¿Algo más que la gente debería saber?",
      "upcoming": "Subiendo",
      "noUpcoming": "No hay próximos eventos.",
      "past": "Pasado",
      "pastToggle_one": "Mostrar el evento pasado {{count}}",
      "pastToggle_other": "Mostrar eventos pasados {{count}}",
      "createdBy": "Añadido por {{name}}",
      "empty": {
        "title": "Todavía no hay eventos",
        "description": "Comparte tu próxima cena, viaje o cita de ensayo con el grupo."
      },
      "deleteTitle": "Eliminar el evento?",
      "deleteConfirm": "¿Realmente eliminar el evento \"{{title}}\"?",
      "errorInvalidStart": "Por favor, seleccione una fecha y hora de inicio válidas.",
      "errorInvalidEnd": "Por favor, elija una fecha y hora de final válido, o déjelo vacío.",
      "errorEndBeforeStart": "El final no debe ser antes del comienzo.",
      "viewAgenda": "Programa",
      "viewMonth": "Mes",
      "viewDay": "Día",
      "viewAria": "Calendario de distribución",
      "prevDay": "Día previo",
      "nextDay": "Próximo día",
      "dayTitle": "Eventos en {{date}}",
      "dayEmpty": "Nada planeado este día.",
      "hintPickDay": "Pulse un día para ver o agregar eventos.",
      "fromTrip": "De itinerario",
      "fromTripNamed": "Viaje: {{name}}",
      "openInTrip": "Abierto en planificador de viaje",
      "personalTitle": "Mi calendario",
      "personalSubtitle": "Eventos privados, sólo visibles para usted.",
      "togglePersonal": "Mis eventos privados",
      "toggleGroupEvents": "Eventos de mis grupos",
      "timeFormatLabel": "Formato del tiempo",
      "timeFormat24": "24 horas",
      "timeFormat12": "12h",
      "personalBadge": "Privado",
      "fromGroup": "De: {{name}}",
      "openInGroup": "Abierto en calendario de grupo"
    },
    "categories": {
      "title": "Categoría",
      "manage": "Categorías de gestión",
      "add": "Agregar categoría",
      "name": "Categoría nombre",
      "color": "Color",
      "none": "Todavía no hay categorías.",
      "unassigned": "No categoría",
      "filterAll": "Todo ({{count}})",
      "uncategorized": "Uncategorized ({{count}})",
      "deleteTitle": "Eliminar la categoría?",
      "deleteConfirm": "Quitar la categoría \"{{name}}\"? Los eventos guardan sus datos pero pierden su etiqueta."
    },
    "grid": {
      "prevMonth": "Mes anterior",
      "nextMonth": "Mes siguiente",
      "today": "Hoy",
      "pickDate": "Elige una cita"
    }
  },
  "shopping": {
    "lists": {
      "backToGroup": "Volver al grupo",
      "title": "Listas de compras",
      "subtitle": "Escoge una lista o crea una nueva.",
      "newList": "Nueva lista",
      "nameLabel": "Nombre de la lista",
      "namePlaceholder": "por ejemplo, viaje de camping",
      "create": "Crear lista",
      "createFirst": "Crear la primera lista",
      "emptyTitle": "Aún no hay listas.",
      "emptyHint": "Crea tu primera lista, por ejemplo, 'Pequeñas comestibles'. Puedes tener tantas listas como necesites.",
      "cardEmpty": "Todavía no hay artículos",
      "cardOpen_one": "{{count}} elemento abierto",
      "cardOpen_other": "{{count}} elementos abiertos",
      "cardDone_one": "{{count}} hecho",
      "cardDone_other": "{{count}} hecho",
      "status": {
        "empty": "Vacío",
        "active": "Activo",
        "done": "Todo hecho"
      },
      "delete": "Lista eliminada",
      "deleteTitle": "Eliminar la lista?",
      "deleteConfirm": "Eliminar '{{name}}' y todos sus elementos? Si esta es tu última lista, se creará una nueva vacía.",
      "deleted": "Lista eliminada."
    },
    "personal": {
      "title": "Mis compras",
      "subtitle": "Listas privadas sólo usted ve, más vista opcional de las listas de cada grupo.",
      "yourListsTitle": "Sus listas",
      "groupListsTitle": "Listas de grupos",
      "toggleGroupLists": "Mostrar listas de mis grupos",
      "noGroupLists": "Ninguno de sus grupos tiene una lista de compras todavía.",
      "emptyTitle": "Aún no hay listas personales",
      "emptyHint": "Cree su primera lista privada, por ejemplo, 'Pequeñas comestibles' o 'Hardware store'.",
      "backToLists": "Todas mis listas",
      "listSubtitle": "Lista privada - sólo visible para usted."
    },
    "overview": {
      "backToGroup": "Volver al grupo",
      "title": "Lista de compras",
      "subtitle": "Lista de comprobación compartida para este grupo.",
      "item": "Tema",
      "itemPlaceholder": "e.g. Milk",
      "quantity": "Qty",
      "quantityPlaceholder": "1l",
      "noteOptional": "Nota (opcional)",
      "add": "Añadir",
      "openTitle_one": "Para comprar ({{count}})",
      "openTitle_other": "Para comprar ({{count}})",
      "doneTitle_one": "Hecho ({{count}})",
      "doneTitle_other": "Hecho ({{count}})",
      "allDone": "Todo hecho - gran trabajo!",
      "clearDone": "Despejado",
      "clearTitle": "¿Despejados artículos completados?",
      "clearConfirm_one": "Eliminar {{count}} artículo completado?",
      "clearConfirm_other": "Eliminar los elementos {{count}} completados?",
      "markDone": "Marca comprada",
      "markOpen": "Mark como aún necesitado",
      "addedBy": "por {{name}}",
      "doneBy": "comprado por {{name}}",
      "deleteTitle": "Eliminar el tema?",
      "deleteConfirm": "¿De verdad eliminar \"{{name}}\"?",
      "backToLists": "Todas las listas",
      "renameTitle": "Lista de nombres",
      "deleteList": "Lista eliminada",
      "empty": {
        "title": "Todavía no hay artículos",
        "description": "Añade lo primero que necesitas."
      },
      "catalog": {
        "categories": {
          "dairy": "Huevos lácteos",
          "bakery": "Panadería",
          "fruitVeg": "Frutas y verduras",
          "meatFish": "Carne & pescado",
          "pantry": "Pantry",
          "frozen": "Frozen",
          "drinks": "Bebidas",
          "snacks": "Snacks & sweets",
          "household": "Hogar",
          "hygiene": "Higiene"
        },
        "items": {
          "milk": "Milk",
          "butter": "Butter",
          "cheese": "Queso",
          "yoghurt": "Yoghurt",
          "cream": "Crema",
          "quark": "Quark",
          "eggs": "huevos",
          "bread": "Pan",
          "rolls": "Rolls",
          "toast": "Toast",
          "flour": "Flour",
          "sugar": "Azúcar",
          "yeast": "Levadura",
          "tomatoes": "Tomates",
          "onions": "cebollas",
          "potatoes": "Papas",
          "carrots": "Carrotas",
          "cucumber": "Cucumber",
          "pepper": "Pimienta de la campana",
          "salad": "Salario",
          "garlic": "Ajo",
          "avocado": "Avocado",
          "mushrooms": "Setas",
          "apples": "Apples",
          "bananas": "Bananas",
          "oranges": "Naranjas",
          "lemons": "Lemons",
          "grapes": "Uvas",
          "berries": "Berries",
          "chicken": "Pollo",
          "mincedMeat": "Carne picada",
          "ham": "Ham",
          "salmon": "Salmón",
          "tuna": "Atún",
          "tofu": "Tofu",
          "pasta": "Pasta",
          "rice": "Rice",
          "tomatoSauce": "Salsa de tomate",
          "oliveOil": "Aceite de oliva",
          "vinegar": "Vinegar",
          "salt": "Salt",
          "blackPepper": "Pimiento negro",
          "spices": "Spices",
          "cereals": "Cereales",
          "oats": "Oats",
          "peanutButter": "Manteca de cacahuete",
          "jam": "Jam",
          "honey": "Cariño",
          "frozenVeg": "Verdura congelado",
          "frozenPizza": "Pizza congelado",
          "icecream": "Helado",
          "water": "Agua",
          "coffee": "Café",
          "tea": "Tea",
          "juice": "Jugo",
          "plantMilk": "Leche vegetal",
          "beer": "Cerveza",
          "wine": "Vino",
          "chocolate": "Chocolate",
          "chips": "Chips",
          "cookies": "Cookies",
          "nuts": "Nuts",
          "toiletPaper": "Papel higiénico",
          "kitchenRoll": "Rollo de cocina",
          "dishSoap": "Jabón de basura",
          "laundryDetergent": "Detergente de lavandería",
          "trashBags": "Bolsas de basura",
          "spongesCloths": "Esponjas & telas",
          "toothpaste": "Toothpaste",
          "shampoo": "Shampoo",
          "showerGel": "gel de ducha",
          "soap": "Soap",
          "deodorant": "Deodorant"
        }
      }
    }
  },
  "tasks": {
    "overview": {
      "backToGroup": "Volver al grupo",
      "title": "Tareas",
      "subtitle": "¿Quién hace qué?",
      "add": "Nueva tarea",
      "filterAria": "Filtro de tareas",
      "filterAll": "Todos",
      "filterMine": "Mine",
      "filterUnassigned": "No asignados",
      "titleField": "Tareas",
      "titlePlaceholder": "por ejemplo, vacía el lavavajillas",
      "descriptionOptional": "Detalles (opcional)",
      "descriptionPlaceholder": "¿Algo más que saber?",
      "assignee": "Assigned to",
      "unassigned": "Nadie",
      "dueDate": "Due",
      "priority": "Prioridad",
      "priorityLow": "Baja",
      "priorityNormal": "Normal",
      "priorityHigh": "Alto",
      "openTitle_one": "Para hacer ({{count}})",
      "openTitle_other": "Para hacer ({{count}})",
      "doneTitle_one": "Hecho ({{count}})",
      "doneTitle_other": "Hecho ({{count}})",
      "allDone": "Todo hecho - gran trabajo!",
      "noneInFilter": "No hay tareas que coincidan con este filtro.",
      "clearDone": "Despejado",
      "clearTitle": "¿Despejar las tareas terminadas?",
      "clearConfirm_one": "Eliminar la tarea completada {{count}}?",
      "clearConfirm_other": "Eliminar tareas completadas {{count}}?",
      "markDone": "Marcar como hecho",
      "markOpen": "Mark como sigue",
      "addedBy": "añadido por {{name}}",
      "doneBy": "hecho por {{name}}",
      "deleteTitle": "Eliminar la tarea?",
      "deleteConfirm": "¿De verdad eliminar \"{{title}}\"?",
      "dueToday": "Hoy",
      "dueTomorrow": "Mañana.",
      "dueInDays_one": "Due in {{count}} day",
      "dueInDays_other": "Due in {{count}} days",
      "dueOverdue_one": "Atrasado por {{count}} día",
      "dueOverdue_other": "Atrasado por días {{count}}",
      "empty": {
        "title": "No hay tareas todavía",
        "description": "Agregue el primer coro o recados - y asignarlo a alguien."
      }
    },
    "personal": {
      "title": "Mis tareas",
      "subtitle": "Tus todos privados más todo lo asignado a ti en grupos.",
      "yourTasksTitle": "Mis tareas",
      "assignedInGroups": "Asignados en grupos",
      "toggleOverlay": "Mostrar tareas de grupo asignadas a mí",
      "noAssignedTasks": "Nada te ha asignado ahora mismo.",
      "openInGroup": "Abierto en grupo",
      "emptyTitle": "Todavía sin tareas personales",
      "emptyHint": "Captura algo que necesitas hacer. Las tareas privadas no tienen cesionario, son sólo tuyas."
    }
  },
  "games": {
    "title": "Juegos",
    "subtitle": "Gira la rueda o ejecuta un torneo",
    "backToGroup": "Volver al grupo",
    "tabs": {
      "wheel": "Rueda",
      "tournaments": "Torneos"
    },
    "wheel": {
      "title": "Lucky Wheel",
      "spin": "Gire la rueda",
      "spinning": "Girando...",
      "spinAgain": "Gira de nuevo",
      "winner": "Ganador: {{name}}",
      "empty": "Agregue al menos dos personas a girar.",
      "reset": "Despejado todo",
      "removeWinner": "Retirar ganador",
      "autoRemove": "Retirar ganador antes de la siguiente vuelta"
    },
    "picker": {
      "guestPlaceholder": "Nombre del cliente",
      "addGuest": "Añadir",
      "addAllMembers": "Agregar a todos los miembros",
      "allAdded": "Todos los miembros añadidos"
    },
    "participants": {
      "title": "Participantes",
      "count_one": "{{count}} participante",
      "count_other": "Participantes de {{count}}",
      "guest": "invitado",
      "remove": "Retirar",
      "empty": "Todavía no hay participantes."
    },
    "tournaments": {
      "title": "Torneos",
      "newTournament": "Nuevo torneo",
      "emptyTitle": "Aún no hay torneos",
      "emptyHint": "Crea uno para empezar a planear partidos.",
      "create": "Crear",
      "nameLabel": "Nombre",
      "namePlaceholder": "por ejemplo, noche de la FIFA",
      "formatLabel": "Formato",
      "formatPoints": "Puntos",
      "formatPointsHint": "Todos juegan a todos, clasificados en una mesa.",
      "formatElimination": "Knockout",
      "formatEliminationHint": "Eliminación única - perder y estás fuera.",
      "teamsLabel": "Equipos de formularios",
      "teamSizeLabel": "Personas por equipo",
      "teamSizeHint": "El número de equipos se resuelve de esto; las sobras se extienden por lo que algunos equipos son uno más grande. Puedes ajustar los equipos a mano después.",
      "teamsLaterHint": "Usted decidirá en los equipos en el próximo paso mientras que añadir a la gente.",
      "deleteTitle": "Eliminar el torneo?",
      "deleteConfirm": "¿De verdad eliminar \"{{name}}\"?",
      "deleted": "Torneo eliminado"
    },
    "status": {
      "setup": "Configuración",
      "active": "Corriendo",
      "completed": "Terminado"
    },
    "format": {
      "points": "Puntos",
      "elimination": "Knockout"
    },
    "detail": {
      "backToGames": "Volver a juegos",
      "startTournament": "Inicio del torneo",
      "starting": "Comenzando...",
      "needTwo": "Añadir al menos dos participantes para empezar.",
      "entrantsReady_one": "{{count}} entrante listo",
      "entrantsReady_other": "Los participantes {{count}} listos",
      "teamModeOn": "Equipos",
      "started": "¡El Torneo empezó!"
    },
    "teams": {
      "title": "Equipos",
      "modeHint": "Todos juegan solos. En: poner a la gente en equipos que se juegan.",
      "randomize": "Aleatorio",
      "randomizing": "Randomizando...",
      "addTeam": "Agregar equipo",
      "removeTeam": "Retire el equipo",
      "bench": "No asignado",
      "benchEmpty": "Todos están en un equipo.",
      "empty": "Todavía no hay equipos. Aleatorio o agrega uno.",
      "moveHint": "Toca a una persona, luego un equipo para moverlos.",
      "moveSelectedHint": "Moving \"{{name}}\" - toca un equipo o el banco.",
      "moveHere": "Muévanse aquí.",
      "moveToBench": "Muévete al banco",
      "playerCount_one": "{{count}} jugador",
      "playerCount_other": "Jugadores {{count}}",
      "teamEmpty": "Vacío"
    },
    "standings": {
      "title": "Cuadro",
      "rank": "#",
      "entrant": "Entrante",
      "played": "P",
      "won": "W",
      "drawn": "D",
      "lost": "L",
      "points": "Pts"
    },
    "matches": {
      "title": "Partidos",
      "round": "Round {{n}}",
      "tbd": "TBD",
      "bye": "Adiós.",
      "resultSaved": "Resultado salvado",
      "winHint": "Pulsa el ganador",
      "draw": "Marcar como sorteo",
      "drawShort": "Tie"
    },
    "bracket": {
      "final": "Final",
      "champion": "Champion: {{name}}"
    }
  },
  "invite": {
    "joiningTitle": "Un grupo...",
    "joiningSubtitle": "Usar código de invitación {{code}}",
    "backToDashboard": "Volver a grupos"
  },
  "admin": {
    "title": "Administración de usuarios",
    "subtitle": "Aprobar nuevos registros, otorgar derechos de administración, eliminar cuentas.",
    "backToDashboard": "Dashboard",
    "notAdmin": "Acceso al personal necesario.",
    "empty": "Sin usuarios.",
    "registered": "Registrado {{date}}",
    "approvedAt": "{{date}}",
    "approve": "Aprobar",
    "promote": "Hacer administrador",
    "demote": "Remove admin",
    "delete": "Eliminar el usuario",
    "deleteTitle": "Eliminar usuario?",
    "deleteConfirm": "¿De verdad borrar este usuario? Esto solo funciona si todavía no tienen grupos o gastos.",
    "badgeAdmin": "Admin",
    "badgePending": "Pendiente",
    "searchPlaceholder": "Búsqueda por nombre o correo electrónico...",
    "searchClear": "Búsqueda clara",
    "filterAll": "Todos",
    "filterPending": "Pendiente",
    "filterApproved": "Aprobado",
    "filterAdmin": "Admins",
    "noResults": "Ningún usuario coincide con sus filtros."
  }
};

export default es;
