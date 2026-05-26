# Brief — Red Cão Algarve

## 1. Resumen ejecutivo

En el Algarve existe una red informal muy activa de personas, grupos de Facebook, asociaciones y voluntarios que ayudan a perros perdidos, encontrados, robados, abandonados o en situación de maltrato. Esa red ya tiene algo muy difícil de construir: comunidad, atención local, confianza y movimiento.

El problema es que la operación ocurre de forma fragmentada: posts incompletos, avistamientos dispersos, duplicados, dificultad para verificar información, pérdida de contexto, poca trazabilidad, denuncias mal estructuradas y mucho trabajo manual para personas que ya están saturadas.

La propuesta no es crear “otra red social” ni sustituir a los grupos existentes. La propuesta es construir una capa tecnológica gratuita, ligera y respetuosa que ayude a las redes actuales a operar mejor.

La solución inicial sería una herramienta para convertir cada perro perdido, encontrado, visto o en posible situación de riesgo en un caso estructurado, con cartel, post, QR, página pública, avistamientos, mapa privado, dossier y posibles coincidencias visuales mediante IA.

El objetivo no es monetizar. El objetivo es maximizar adopción, coordinación e impacto.

---

## 2. Investigaciones de referencia

Este brief se apoya en dos líneas de investigación que se adjuntarán como material complementario:

1. **Investigación sobre el problema, casos de éxito y uso de tecnología en perros perdidos, robados o maltratados.**  
   Incluye análisis de dinámicas comunitarias, casos reales de recuperación de perros, redes locales, mecanismos de difusión, coordinación entre voluntarios, asociaciones y autoridades, y oportunidades de mejora mediante tecnología.

2. **Investigación sobre IA para reconocimiento individual de perros.**  
   Revisa el estado del arte en identificación y reidentificación animal, modelos visuales, embeddings, comparación de imágenes, limitaciones técnicas, falsos positivos, datasets disponibles y realismo de construir un sistema regional de posibles coincidencias visuales.

Las investigaciones no cierran la solución. Sirven como base para formular hipótesis, entender riesgos y decidir qué probar primero con actores locales.

---

## 3. ¿Cuál es el problema?

El problema no es solo que desaparezcan perros o que haya maltrato. El problema operativo es que, cuando ocurre, la respuesta depende de canales humanos muy frágiles.

Hoy el flujo suele ser:

- un dueño publica desesperado;
- la información está incompleta;
- otras personas comparten;
- alguien comenta un avistamiento;
- otro grupo publica un perro parecido;
- alguien ve un anuncio sospechoso;
- una asociación intenta ayudar;
- pero no hay un expediente único, ni mapa, ni seguimiento, ni matching visual, ni dossier claro.

Eso genera varias pérdidas:

**Pérdida de tiempo.** Las primeras horas son críticas y se pierden pidiendo información básica.

**Pérdida de información.** Avistamientos importantes quedan enterrados en comentarios, mensajes privados o publicaciones antiguas.

**Pérdida de coordinación.** Distintos grupos pueden estar trabajando el mismo caso sin saberlo.

**Pérdida de evidencia.** Cuando hay sospecha de robo, negligencia o maltrato, la información no siempre queda documentada de forma útil.

**Pérdida de confianza.** Posts falsos, duplicados, fraudes o acusaciones no verificadas pueden dañar la red.

**Carga emocional y operativa.** Admins, asociaciones y voluntarios hacen muchísimo trabajo manual, repetitivo y sensible.

El problema central:

> La comunidad existe, pero le falta infraestructura operativa.

---

## 4. ¿Quién tiene el problema?

### Usuarios primarios

#### Admins de grupos de Facebook

Son probablemente el primer usuario real. Ya tienen audiencia, flujo de casos y criterio local. Su problema es gestionar volumen, calidad de información, duplicados, avistamientos, conflictos y verificación.

Dolor principal: demasiado trabajo manual y demasiada información desordenada.

#### Asociaciones y voluntarios

Trabajan con perros perdidos, encontrados, abandonados o maltratados. Necesitan priorizar, coordinar, documentar, comunicar y actuar.

Dolor principal: falta de herramientas simples para convertir observaciones en acciones.

#### Dueños de perros perdidos

Están emocionalmente desbordados. Necesitan actuar rápido, pero no saben qué información dar, dónde publicar, cómo hacer un cartel, cómo recoger avistamientos o cómo denunciar.

Dolor principal: caos, urgencia y falta de guía.

### Usuarios secundarios

#### Personas que ven un perro

Quieren ayudar, pero no saben dónde reportar, qué foto hacer, a quién llamar o qué información es útil.

Dolor principal: fricción para reportar bien.

#### Clínicas veterinarias, CROs y refugios

Pueden recibir perros encontrados y necesitar comprobar si hay coincidencias con casos activos.

Dolor principal: identificación y conexión rápida con dueños o redes.

#### Autoridades o entidades municipales

No serían usuarios iniciales, pero podrían beneficiarse de dossiers más claros y casos mejor documentados.

Dolor principal: denuncias incompletas, ruido y poca trazabilidad.

---

## 5. Propuesta de valor

La propuesta de valor debe expresarse de forma distinta según usuario.

### Para admins de Facebook

> Os ayudamos a convertir posts y mensajes caóticos en casos claros, compartibles y seguibles, sin sustituir vuestro grupo.

Valor:

- menos preguntas repetidas;
- posts más completos;
- carteles automáticos;
- avistamientos estructurados;
- menos duplicados;
- mejor seguimiento;
- más capacidad con el mismo esfuerzo.

### Para asociaciones

> Una herramienta gratuita para documentar, priorizar y coordinar casos de perros perdidos, encontrados o en posible riesgo.

Valor:

- mapa privado;
- dossier por caso;
- evidencia ordenada;
- seguimiento;
- matching visual;
- exportación para denuncia o colaboración.

### Para dueños

> En pocos minutos tienes un caso bien montado: cartel, post, QR, enlace y sistema de avistamientos.

Valor:

- rapidez;
- claridad;
- difusión;
- sensación de dirección;
- mejor coordinación.

### Para ciudadanos

> Si ves un perro, puedes ayudar bien en menos de un minuto.

Valor:

- reportar con foto, ubicación, hora y contexto;
- ayudar sin tener que saber a qué grupo escribir;
- evitar que los avistamientos se pierdan en comentarios.

### Propuesta central

> Red Cão Algarve ayuda a las redes existentes a encontrar, documentar y coordinar casos de perros perdidos, encontrados, robados o en riesgo, usando tecnología e IA de forma responsable, gratuita y comunitaria.

---

## 6. Solución propuesta

La solución inicial no debe ser una app enorme. Debe ser una herramienta modular.

### Módulo 1 — Formulario único de caso

Para perros perdidos, encontrados, vistos, posibles robos o situaciones de bienestar animal.

Recoge:

- fotos;
- zona;
- fecha y hora;
- descripción;
- contacto;
- señales distintivas;
- estado del chip;
- permiso de publicación;
- nivel de sensibilidad.

### Módulo 2 — Generador de post y cartel

Genera automáticamente:

- post de Facebook;
- mensaje de WhatsApp;
- cartel A4 con QR;
- imagen cuadrada;
- traducciones si hacen falta.

### Módulo 3 — Página pública del caso

Cada caso tiene una URL compartible con:

- fotos;
- descripción;
- zona aproximada;
- estado;
- botón de contacto;
- cartel;
- botón “vi este perro”.

### Módulo 4 — Avistamientos estructurados

Cualquier persona puede enviar:

- foto;
- ubicación;
- hora;
- nota;
- dirección en la que iba el perro;
- contacto opcional.

Los avistamientos se organizan en una línea temporal y mapa privado.

### Módulo 5 — Panel para admins y asociaciones

Gestión de casos:

- pendientes;
- activos;
- urgentes;
- resueltos;
- descartados;
- duplicados.

Incluye mapa, timeline, exportación y revisión.

### Módulo 6 — IA visual

Búsqueda de posibles coincidencias entre:

- perros perdidos;
- perros encontrados;
- avistamientos;
- anuncios sospechosos;
- fotos subidas por voluntarios;
- perros retenidos o en jaulas, si el caso es sensible y privado.

Importante: la IA nunca decide. Solo sugiere posibles coincidencias.

### Módulo 7 — Dossier de bienestar animal

Cuando no hay match con desaparecidos pero hay posible problema de bienestar:

- perro atado;
- perro enjaulado;
- sin agua visible;
- sin sombra;
- malnutrido;
- herido;
- hacinado;
- abandonado.

La app crea un dossier factual:

- fotos;
- fechas;
- ubicación privada;
- descripción objetiva;
- cronología;
- nivel de urgencia;
- plantilla para asociación o autoridad.

---

## 7. Principios de producto

### No competir con Facebook

Facebook es donde está la red. La herramienta debe integrarse con Facebook, no reemplazarlo.

### No sustituir a asociaciones ni admins

La herramienta existe para ayudarles, no para quitarles protagonismo.

### No acusar

La app no debe decir “este perro es robado” o “esta persona maltrata”. Debe decir “posible coincidencia” u “observación de bienestar pendiente de revisión”.

### Privacidad por defecto

Ubicaciones exactas, datos personales, matrículas, caras y sospechas deben tratarse con cuidado.

### Revisión humana

Todo caso sensible debe pasar por admins o personas verificadas.

### Gratuito siempre

Ningún cobro a dueños, grupos o asociaciones.

### Adopción antes que perfección

La herramienta debe ser útil aunque la IA visual sea imperfecta.

---

## 8. Ventaja competitiva

Aunque no sea un negocio, sí necesita ventaja estratégica.

### Ventaja 1 — Construido alrededor de redes existentes

La mayor ventaja no es tecnológica. Es social. Si los grupos actuales lo adoptan, el producto hereda distribución, legitimidad y conocimiento local.

### Ventaja 2 — Velocidad de construcción

La capacidad de construir rápido permite experimentar con módulos pequeños y adaptarlos al feedback real.

### Ventaja 3 — IA aplicada a un flujo concreto

No “IA para animales” en abstracto, sino IA para tareas concretas:

- extraer información;
- generar posts;
- crear carteles;
- agrupar avistamientos;
- buscar coincidencias visuales;
- preparar dossiers.

### Ventaja 4 — Datos estructurados locales

Con el tiempo, la red acumula una base de casos, avistamientos, imágenes, zonas y patrones. Eso mejora la utilidad del sistema.

### Ventaja 5 — Confianza y neutralidad

Al ser gratuito, sin monetización y al servicio de redes existentes, puede generar menos resistencia que una startup comercial.

### Ventaja 6 — Diseño responsable

El enfoque de privacidad, no acusación y revisión humana puede diferenciarlo de grupos caóticos o herramientas peligrosas.

---

## 9. Growth strategy

La estrategia de crecimiento debe ser comunitaria, no publicitaria.

### Fase 1 — Validación cualitativa

Hablar con:

- 3–5 admins de grupos de Facebook;
- 2–3 asociaciones;
- 1–2 clínicas veterinarias;
- voluntarios activos.

Objetivo: entender flujo real, no vender solución.

### Fase 2 — Piloto con un grupo

No lanzar a todo Algarve.

Elegir un grupo o admin receptivo y ofrecer:

- formulario;
- cartel automático;
- página de caso;
- botón de avistamiento.

Medir si reduce trabajo y mejora calidad de casos.

### Fase 3 — Casos de éxito

Documentar historias reales:

- perro encontrado gracias a avistamientos;
- dueño que creó cartel en minutos;
- admin que redujo trabajo;
- asociación que generó dossier útil;
- match visual entre encontrado y perdido.

El crecimiento vendrá de pruebas visibles, no de claims.

### Fase 4 — Expansión grupo a grupo

Cada grupo mantiene su identidad.

La herramienta puede aparecer como apoyo operativo, pero el grupo sigue siendo el canal principal.

### Fase 5 — Red de colaboradores

Incluir:

- clínicas;
- refugios;
- groomers;
- paseadores;
- cafés dog-friendly;
- urbanizaciones;
- asociaciones.

Cada colaborador puede tener QR o link para reportar perros vistos o encontrados.

### Fase 6 — Integración ligera con campañas

Cuando un caso es urgente, el sistema puede ayudar a crear Facebook Ads hiperlocales:

- radio recomendado;
- copy;
- imagen;
- llamada a la acción;
- actualizaciones.

No como negocio, sino como guía para dueños o voluntarios que quieran financiar difusión.

---

## 10. Business model / Operating model

No hay modelo de negocio comercial. Hay modelo operativo sostenible.

### Principio

100% gratuito para usuarios, dueños, grupos y asociaciones.

### Opciones de estructura

#### Opción A — Proyecto voluntario

Más simple para empezar. Rápido, flexible, sin burocracia.

Riesgo: dependencia total de una persona.

#### Opción B — Associação sem fins lucrativos

Más seria si crece. Permite donaciones, colaboraciones, convenios y gobernanza.

Riesgo: más administración.

#### Opción C — Open-source + comunidad

Código abierto parcial o total. Permite replicabilidad en otras regiones.

Riesgo: requiere mantenimiento y control de calidad.

#### Opción D — Fundación/proyecto social financiado por donaciones

Si hay adopción real, se pueden aceptar donaciones para infraestructura, servidores, impresión de carteles, campañas urgentes o desarrollo.

Riesgo: gestionar transparencia y expectativas.

### Costes

- hosting;
- almacenamiento de imágenes;
- IA;
- mapas;
- emails;
- dominio;
- soporte;
- moderación.

### Financiación posible sin cobrar

- donaciones voluntarias;
- sponsors locales éticos;
- clínicas veterinarias colaboradoras;
- grants de bienestar animal;
- municipios;
- fundaciones;
- crowdfunding para infraestructura;
- trabajo voluntario.

Regla: que la financiación no capture el producto ni distorsione su misión.

---

## 11. TARS Funnel

TARS: Target, Acquired, Retained, Satisfied.

Este funnel ayuda a pensar adopción e impacto.

### T — Target

¿A quién queremos servir primero?

No “todo el Algarve”.

Target inicial:

- admins de grupos de Facebook de perros perdidos/encontrados;
- asociaciones pequeñas y medianas;
- voluntarios activos que ya mueven casos.

Target secundario:

- dueños de perros perdidos;
- personas que reportan avistamientos;
- clínicas, refugios y CROs.

Métricas de Target:

- número de grupos identificados;
- número de admins contactados;
- número de asociaciones contactadas;
- número de entrevistas realizadas;
- número de flujos reales documentados.

Pregunta clave:

> ¿Estamos resolviendo un problema de personas que ya tienen flujo real de casos?

### A — Acquired

¿Cómo entran al sistema?

Canales:

- mensaje directo a admins;
- piloto privado;
- link pegado en posts de Facebook;
- QR en carteles;
- recomendación de asociaciones;
- clínicas veterinarias;
- casos de éxito compartidos.

Métricas:

- admins que aceptan probar;
- casos creados;
- formularios completados;
- carteles generados;
- páginas públicas compartidas;
- avistamientos enviados.

Objetivo inicial:

No buscar miles de usuarios. Buscar 1–3 operadores comprometidos y 20–50 casos reales.

Pregunta clave:

> ¿La herramienta entra de forma natural en el flujo actual de Facebook?

### R — Retained

¿Vuelven a usarlo?

Para admins y asociaciones, retención significa que lo usan en nuevos casos.

Métricas:

- casos por admin por semana;
- porcentaje de casos actualizados;
- porcentaje de avistamientos revisados;
- número de carteles o posts generados por caso;
- tiempo medio hasta publicación;
- admins activos 7/30 días.

Señal fuerte:

> Cuando hay un caso nuevo, mándalo por el formulario.

Pregunta clave:

> ¿La herramienta reduce trabajo o añade trabajo?

Si añade trabajo, falla.

### S — Satisfied

¿Están satisfechos y lo recomiendan?

Satisfacción no es solo “les gusta”. Es impacto percibido.

Métricas:

- feedback cualitativo de admins;
- testimonios;
- casos resueltos donde la herramienta ayudó;
- tiempo ahorrado;
- calidad de posts;
- menos información faltante;
- mejor coordinación;
- número de grupos que piden acceso por recomendación.

Señales cualitativas:

- “Esto nos ahorra tiempo.”
- “Los casos llegan más completos.”
- “Los avistamientos ya no se pierden.”
- “Nos ayuda a explicar qué hacer.”
- “Sirvió para encontrar un perro.”
- “Sirvió para documentar una situación.”

Pregunta clave:

> ¿Los usuarios sienten que la herramienta aumenta su capacidad real de ayudar?

---

## 12. Métricas de impacto

Como no es un negocio, las métricas deben ser de adopción e impacto.

### Métricas operativas

- casos creados;
- carteles generados;
- avistamientos recibidos;
- casos resueltos;
- tiempo desde desaparición hasta publicación;
- porcentaje de casos con información completa;
- número de duplicados detectados;
- número de matches revisados;
- dossiers generados.

### Métricas comunitarias

- admins activos;
- grupos participantes;
- asociaciones participantes;
- clínicas colaboradoras;
- voluntarios verificados.

### Métricas de bienestar

- casos de posible maltrato documentados;
- dossiers enviados a asociaciones o autoridades;
- seguimientos realizados;
- animales retirados o ayudados, si se puede documentar de forma responsable.

### Métricas de confianza

- falsos positivos;
- reportes abusivos;
- casos sensibles gestionados correctamente;
- quejas;
- tiempo de revisión humana.

---

## 13. Riesgos

### Riesgo social

Parecer que se viene a sustituir a quienes ya hacen el trabajo.

Mitigación: co-diseñar con admins y asociaciones.

### Riesgo legal

Fotos de propiedades, personas, matrículas o acusaciones.

Mitigación: privacidad, blur automático, lenguaje factual, no publicar ubicaciones exactas.

### Riesgo de falsas coincidencias

La IA puede equivocarse.

Mitigación: “posibles coincidencias”, revisión humana, nunca acusación automática.

### Riesgo de confrontación

Dueños o voluntarios podrían ir a enfrentarse a alguien.

Mitigación: mensajes claros de no confrontar y canalizar a asociaciones o autoridades.

### Riesgo de baja adopción

Si la herramienta complica el flujo, no se usará.

Mitigación: empezar con el módulo más simple: formulario + post + cartel + QR.

### Riesgo de moderación

Si se abre al público demasiado rápido, puede llenarse de ruido.

Mitigación: piloto privado, roles y permisos.

---

## 14. Hipótesis a validar

### Hipótesis 1

Los admins de Facebook quieren una herramienta que estructure casos.

Validación: entrevistas y piloto.

### Hipótesis 2

Los dueños completarán un formulario si el grupo se lo pide.

Validación: ratio de formularios completados.

### Hipótesis 3

Carteles y posts automáticos mejoran difusión y calidad.

Validación: feedback de admins y engagement.

### Hipótesis 4

Los avistamientos estructurados ayudan más que comentarios dispersos.

Validación: casos con timeline/mapa y resolución.

### Hipótesis 5

El matching visual aporta valor aunque no sea perfecto.

Validación: número de matches útiles revisados.

### Hipótesis 6

El dossier de bienestar ayuda a documentar situaciones sin generar caos.

Validación: uso por asociaciones y calidad percibida.

---

## 15. MVP recomendado

### MVP v0.1

- Formulario de caso.
- Página pública.
- Generador de post de Facebook.
- Generador de cartel con QR.
- Botón “Vi este perro”.
- Panel privado básico para admins.
- Export simple de dossier.

Sin IA visual avanzada todavía.

### MVP v0.2

- Matching visual entre perdidos, encontrados y avistamientos.
- Extracción automática de atributos desde fotos.
- Mapa privado.
- Timeline de avistamientos.
- Dossier de bienestar animal.

### MVP v0.3

- Subida de anuncios sospechosos.
- Comparación visual con casos activos.
- Roles de asociación y clínica.
- Plantillas de comunicación.
- Estadísticas de impacto.

---

## 16. Posicionamiento

### Mensaje principal

> No queremos crear otro grupo. Queremos ayudar a los grupos que ya existen.

### Mensaje de producto

> Una herramienta gratuita para organizar casos, generar carteles, recoger avistamientos y encontrar posibles coincidencias entre perros perdidos, encontrados o en riesgo.

### Mensaje ético

> La IA no acusa, no decide y no sustituye a personas. Solo ayuda a ordenar información y sugerir posibles coincidencias para revisión humana.

### Mensaje comunitario

> Construido con las personas que ya ayudan a los animales en el Algarve.

---

## 17. Decisión estratégica

La mejor estrategia no es lanzar una plataforma pública.

La mejor estrategia es:

1. escuchar a quienes ya gestionan casos;
2. construir una herramienta pequeña para ellos;
3. probar con casos reales;
4. medir si reduce trabajo y mejora resultados;
5. crecer por confianza, no por marketing.

La visión grande puede ser una red regional de respuesta para perros perdidos, robados o en riesgo.

Pero el primer producto debe ser humilde:

> Un sistema gratuito que convierte un caso caótico en una ficha útil, compartible, seguible y accionable.

Ese es el wedge.

