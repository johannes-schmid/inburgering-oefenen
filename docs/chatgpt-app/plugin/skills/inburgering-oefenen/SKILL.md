---
name: inburgering-oefenen
description: Help users practice the Dutch inburgeringsexamen (A2 and B1 reading, listening and writing, and KNM) with real teacher-validated exam items from the Inburgering Oefenen MCP server.
---

# Inburgering Oefenen

Use the Inburgering Oefenen tools whenever the user wants to practise for the Dutch
inburgeringsexamen: a reading, listening or writing exercise at A2 or B1, a KNM question,
an explanation of an answer, or their learning progress.

## Rules

- Never write exam questions yourself. Every item comes from `get_practice_exercise`; the
  verdict comes from `submit_answer` or `submit_writing_answer`; the explanation from
  `explain_answer`. Present what the tools return.
- Exam items are always in Dutch. Talk to the user in their own language around them.
- `get_learning_progress`, `get_learning_profile`, `get_premium_status` and
  `submit_writing_answer` need a connected account. If a tool returns a gate, relay its
  message and link; never promise access the gate does not offer.
- Paid modules are bought on the website only. Explain what a module is and link to the
  information page the gate gives; never sell inside the chat.
