# Nona — Modelo de Negócio (com números)
*2026-05-29. Guia accionável, não opinião. Regra sagrada: NUNCA cobrar a quem perdeu o cão. Tudo grátis no pior momento. Monetiza-se o resto.*

---

## 0. A tese central (o reframe criativo)

> **Nona monetiza todo o ciclo de vida do dono de cão — EXCETO o momento de crise.**

Quem perdeu o cão nunca paga. É o **coração** que ganha confiança. E essa confiança é o **ativo de distribuição** que torna tudo o resto possível. A pergunta não é "como cobrar ao dono em pânico" (nunca) — é:

**"Quem POUPA dinheiro quando um cão é recuperado? Captura uma fatia DESSE valor."**

Recuperar um cão tem valor económico para terceiros:
- **Seguradoras** — um cão recuperado é um sinistro evitado (€500-3.000 de payout poupado).
- **Canis/câmaras** — menos dias de alojamento de errantes (cada dia custa €). Reunião rápida = poupança directa.
- **A indústria pet** — donos que viveram um susto compram prevenção (GPS, chip, tags).

A mãe que recupera a Pipoca não é o cliente. É a história que faz com que a seguradora, a câmara e a Tractive queiram estar ao lado da Nona.

---

## 1. O custo real da Nona (o que há que cobrir)

Estimativa do stack actual (Claude + OpenAI + Fly + Vercel + Supabase + Meta):

| Item | Custo |
|---|---|
| **Fixo/mês** — Vercel Pro (~€20) + Supabase Pro (~€25) + Fly (ML + bot, scale-to-zero ~€25-75) + domínio | **~€80-120/mês** |
| **Variável/caso** — intake Haiku (~€0,02) + PI agent Sonnet (vários ciclos proativos, ~€0,30-1,00) + Whisper/embeddings (~€0,05) + ML foto (no fixo Fly) | **~€0,50-1,50/caso** |

**Break-even por escala:**
- 100 casos/mês → ~€150-270/mês (~€2-3k/ano)
- 1.000 casos/mês → ~€600-1.600/mês
- O custo escala ~linear com casos (dominado pelo agente Sonnet). **A meta de receita inicial é trivial: cobrir ~€3k/ano.** Isto NÃO precisa de um "negócio" — precisa de uma ou duas linhas pequenas. O negócio é para CRESCER e financiar a missão, não para sobreviver.

*Nota de eficiência: o agente PI (Sonnet, proativo) é 80% do custo variável. Se o custo apertar, faz-se o PI agent mais frugal (menos triggers, Haiku para ciclos rotineiros) antes de tocar em qualquer monetização.*

---

## 2. As fontes de receita, quantificadas (mercado PT real)

Dados de mercado (fontes no fim): **Portugal — 681 M€/ano em pet, ~5M animais, ~3M donos de cães, 60% dos lares com animal, 2º país UE em cães/habitante; mercado a crescer para 1,3 mil M€ até 2029.**

### 🥇 A. Cunha de seguros — a jogada mais alinhada e maior
**O facto explosivo: só ~5% dos donos em Portugal têm seguro pet, vs 70% no Reino Unido/Suécia.** Whitespace enorme, mercado a abrir.

Por que encaixa perfeito:
- A seguradora **quer** que o cão seja recuperado (sinistro evitado) E quer distribuição num mercado a 5%.
- O **momento de aquisição perfeito**: um dono que acabou de viver o susto (recuperou o cão, ou conhece alguém que o perdeu) é o mais motivado da vida a segurar. *"Recuperaste a Pipoca? Protege-a — eis como."*
- O dono em crise **nunca** vê isto; só aparece DEPOIS da reunião, ou ao público de prevenção.

Números:
- Prémio anual pet PT ~€120-300. Comissão de afiliado/referência típica ~€20-60/apólice convertida (ou rev-share).
- Cenário conservador: 5.000 donos tocados/ano (pós-susto + audiência de prevenção) × 3% conversão = 150 apólices × €40 = **~€6.000/ano**. Escala com alcance.
- **A jogada grande**: 1 parceria de distribuição com UMA seguradora (Fidelidade Pets, Ocidental Pétis, Ageas 4 Patas…) que quer o canal 5%→crescimento. Acordo flat **€10k-50k/ano + por-apólice**. Eles patrocinam a ferramenta grátis (CSR + menos sinistros + marca). Esta única linha pode cobrir custos 10×.

### 🥈 B. Mercado de prevenção (GPS/chip/tags) — afiliação, zero operação
Mercado GPS pet **Europa: €88,7M (2025) → €285M (2035), CAGR 12,4%**, dominado pela Tractive (austríaca).
- O público de prevenção = donos em geral (NÃO o dono em crise). "O cão de um amigo perdeu-se → devia pôr um localizador."
- Afiliado Tractive/Garmin: dispositivo ~€30-50, comissão ~10-15% = **€4-7/dispositivo**. Marketplace/recomendação curada no site + a câmara/comida que a própria Nona já recomenda no protocolo (WP12).
- 1.000 conversões/ano × €5 = €5.000/ano. Cresce com o tráfego.

### 🥉 C. SaaS B2B para canis / câmaras / proteção civil — receita recorrente
Eles **gastam** dinheiro em gestão de errantes; o "sistema operativo" da Nona (gestão de casos + matching ML + geo-inteligência + alerta automático) reduz dias de alojamento = poupança directa.
- Algarve = 16 câmaras; Portugal ~300 municípios, muitos com orçamento de bem-estar animal.
- €50-200/mês por município pela ferramenta operacional. 10 municípios × €100 = **€12.000/ano**. Escalável a nacional.
- Mesma lógica para hospitais veterinários (o chip→reunião) e associações de resgate.

### D. Educação de resgate — o flywheel da missão (modesto em €, enorme em rede)
Precedente real: **Kat Albrecht / Missing Animal Response Network — curso 8 semanas $350, certificação profissional 10 semanas.** Existe mercado.
- Donos que recuperaram → "intervenientes racionais" treinados → ajudam a recuperar outros cães (crescimento + rede humana de campo para casos difíceis — a camada que o software não faz).
- 50 alunos/ano × €150 = **~€7.500/ano**. Mais o valor não-monetário: graduados = evangelistas + voluntários de campo.
- **Honesto:** isto é linha pequena e lenta. Vende-se como missão + crescimento + receita modesta, NÃO como motor principal. Mas é o que cria o *network effect* que o fundador intuiu.

### E. Patrocínio de marca / CSR pet (Royal Canin, Purina, lojas)
- Marcas pet querem associação a uma missão querida. Patrocínio da ferramenta grátis ou de campanhas regionais. **€5k-30k/ano** por patrocinador, sem tocar no dono.

### F. Fundos não-dilutivos (ponte, não modelo)
- **Portugal Inovação Social**: pool de €150M (Fundo Social Europeu), cobre **70%** do projeto (30% de co-investidor). Encaixa "inovação social baseada em ciência".
- **CERV** (UE): €279,7M para 2026.
- Fundações: Gulbenkian, Dogs Trust (grants de bem-estar animal), CSR pet.
- **Uso:** ponte que cobre os ~€3k/ano de infra enquanto se provam recuperações reais. Não é receita sustentável por si — é o capital-semente da fase 0.

---

## 3. Caminho financeiro por fases (a guia)

**Fase 0 — Pré-receita (agora → primeiros casos reais).** Custo ~€100-250/mês.
- Cobre com: 1 grant pequeno (Inovação Social / Dogs Trust / CSR pet) OU o próprio bolso do fundador por uns meses (é trivial a esta escala).
- Objetivo: **10-50 recuperações reais documentadas.** Sem isto, nenhuma seguradora/câmara assina. As recuperações são a moeda.

**Fase 1 — Tração (centenas de casos).** Ativar as linhas zero-operação:
- **Afiliação seguros + GPS** (só links no momento certo, pós-reunião + público prevenção). Cobre o burn sem equipa.
- Meta realista: afiliação cobre 100% dos custos de infra.

**Fase 2 — Escala (milhares de casos + reputação regional).** O motor real:
- **1 parceria de seguradora** (€10-50k/ano) — a linha que mais move.
- **SaaS a municípios/canis** (recorrente).
- **Educação** (flywheel + receita modesta).
- Aqui a Nona passa de "cobre custos" a "financia expansão a Portugal/Espanha".

**Métrica norte de cada fase: € por cão recuperado.** Se a receita por recuperação > custo por recuperação, o modelo é auto-sustentável e cada cão salvo paga o próximo.

---

## 4. Veículo legal (PT/UE)

Recomendação: **híbrido — associação sem fins lucrativos (a alma) + braço comercial.**
- **Associação**: detém a ferramenta grátis + a confiança + elegibilidade a grants (Inovação Social exige entidade) + a mensagem "nunca cobramos a quem sofre". É o que protege a regra sagrada legalmente.
- **Braço comercial (Lda ou contrato)**: gere as linhas comerciais (afiliação, SaaS, educação, patrocínio). Os lucros financiam a associação.
- Uma empresa PODE manter o produto grátis para utilizadores e ainda ganhar com B2B/afiliação — não há conflito. O híbrido é a estrutura clássica de empresa social e maximiza acesso a financiamento + confiança.
- *Acção: confirmar com contabilista PT a forma exata (associação + Lda detida, ou cooperativa, ou sociedade de impacto). Fora do meu alcance dar conselho fiscal — mas a direção é esta.*

---

## 5. O que NÃO fazer (linhas vermelhas)
- ❌ Cobrar ao dono do cão perdido — nunca, por nada.
- ❌ Paywall em qualquer passo da recuperação (protocolo, alertas, matching, partilha — tudo grátis).
- ❌ Vender dados pessoais. (Dados anónimos agregados a investigadores/câmaras: só com cuidado extremo e transparência — risco de confiança alto; adiar.)
- ❌ Ads pagos que o dono custeie via Nona (já decidido: paga direto ao Meta).

---

## 6. Próximos passos concretos (accionáveis)
1. **Documentar recuperações** desde o caso 1 (a moeda de toda negociação B2B). Já temos `case_outcomes` (WS3) — é exatamente para isto.
2. **Afiliação primeiro** (Fase 1, zero esforço): inscrever-se em programas de afiliado Tractive + 1-2 seguradoras PT (Fidelidade/Ocidental). Pôr os links nos momentos certos (pós-reunião no dashboard; recomendação de prevenção na página pública). Cobre o burn.
3. **Pitch de 1 página a UMA seguradora** com a estatística 5%-vs-70% + "recuperamos cães = menos sinistros + somos o vosso canal de distribuição no momento de máxima motivação". Esta é a maior alavanca.
4. **Constituir a associação** (desbloqueia grants + protege a regra sagrada).
5. **Candidatar a 1 grant** (Inovação Social ou Dogs Trust) como ponte da Fase 0.
6. Educação/SaaS = Fase 2, depois de provar recuperações.

---

## Fontes
- Mercado pet PT: Jornal Económico / SAPO ("setor pet 681M€/ano"); Veterinária Atual (balanço 2024); Marktest (3M donos de cães); Público (3,1M registados). Crescimento 1,3 mil M€/2029.
- Seguros pet PT <5% vs UK/Suécia 70%: Alfa Seguros, C1 Brokers, DECO Proteste; providers (Fidelidade Pets, Ocidental Pétis, Ageas 4 Patas, Mapfre-Continente…).
- GPS Europa €88,7M→€285M CAGR 12,4%: MetaTech Insights; Tractive (aquisição Whistle/Mars 2025).
- Comparáveis: Petco Love Lost (nonprofit, Petco Foundation $433M desde 1999, grátis); PawBoost (FB ads + boosts, 35M alcance/mês); Finding Rover (adquirido pela Petco).
- Certificação: Missing Animal Response Network / Kat Albrecht ($350 8sem / cert. pro 10sem).
- Fundos: Portugal Inovação Social (€150M FSE, cobre 70%); CERV (€279,7M 2026); Gulbenkian; Dogs Trust.
