-- Seed: sections table
-- Run after migration 20260528000001_create_sections.sql

insert into sections (id, topic, slug, name_nl, rationale, sort_order) values
(1, 'Geschiedenis en Geografie', 'gg-gouden-eeuw', 'De Gouden Eeuw en handel', 'Questions about the 17th-century Golden Age, the VOC, Amsterdam''s canal houses, and Dutch wealth through trade.', 1),
(2, 'Geschiedenis en Geografie', 'gg-geografie-provincies', 'Geografie, provincies en transport', 'Questions about Dutch provinces, capital cities, water management (polders, Deltaworks, Afsluitdijk), and public transport.', 2),
(3, 'Geschiedenis en Geografie', 'gg-wo2-holocaust', 'Tweede Wereldoorlog en Holocaust', 'Questions about German occupation, the Holocaust, liberation, and post-war legislation against antisemitism.', 3),
(4, 'Geschiedenis en Geografie', 'gg-slavernij-kolonies', 'Slavernij, koloniën en migratie', 'Questions about Dutch colonial history, slavery, Keti Koti, Suriname, and post-war labour migration.', 4),
(5, 'Geschiedenis en Geografie', 'gg-eu-international', 'EU, NAVO en internationale organisaties', 'Questions about the European Union, NATO, UN, EU membership rights, and international cooperation.', 5),
(6, 'Geschiedenis en Geografie', 'gg-herdenkingen', 'Nationale herdenkingen en symbolen', 'Questions about Dodenherdenking (4 mei), Bevrijdingsdag (5 mei), Keti Koti, the Wilhelmus, and other national commemorations.', 6),
(7, 'Wonen', 'wo-huren', 'Huren, huurcontract en huurrecht', 'Questions about renting a home, social housing, housing corporations, lease agreements, tenant rights, and the Huurcommissie.', 7),
(8, 'Wonen', 'wo-kopen', 'Koopwoning, hypotheek en makelaar', 'Questions about buying a home, mortgages, estate agents, and property ownership responsibilities.', 8),
(9, 'Wonen', 'wo-verzekeringen', 'Verzekeringen voor de woning', 'Questions about home insurance (opstal, inboedel, WA), when and how to use them, and insurance obligations.', 9),
(10, 'Wonen', 'wo-energie-utilities', 'Energie, water en internet', 'Questions about arranging energy and water contracts, variable versus fixed tariffs, internet providers, and annual bills.', 10),
(11, 'Wonen', 'wo-afval-milieu', 'Afval scheiden en milieu', 'Questions about waste separation, recycling, municipal collection rules, deposit returns, and chemical waste.', 11),
(12, 'Wonen', 'wo-toeslagen-belasting', 'Huurtoeslag en gemeentelijke belastingen', 'Questions about applying for rent allowance via Dienst Toeslagen, reporting income changes, and local taxes (OZB, riool).', 12),
(13, 'Wonen', 'wo-samenwonen-trouwen', 'Samenwonen, trouwen en relatie', 'Questions about cohabitation, marriage, registered partnership, legal rights, and municipality registration.', 13),
(14, 'Gezondheid en Gezondheidszorg', 'gz-huisarts', 'Huisarts en eerste hulp', 'Questions about registering with a GP, when to call the huisartsenpost, referrals, the role of the translator, and switching doctors.', 14),
(15, 'Gezondheid en Gezondheidszorg', 'gz-zorgverzekering', 'Zorgverzekering en eigen risico', 'Questions about mandatory health insurance, switching insurer, supplementary insurance, eigen risico, and claiming reimbursement.', 15),
(16, 'Gezondheid en Gezondheidszorg', 'gz-apotheek-medicijnen', 'Apotheek, medicijnen en recept', 'Questions about obtaining prescriptions, visiting the pharmacy, own contribution for medicines, and the role of the GP in prescribing.', 16),
(17, 'Gezondheid en Gezondheidszorg', 'gz-specialist-tandarts', 'Specialist, tandarts en mondzorg', 'Questions about referrals to specialists, dental care, the mondhygiënist, and how to register with a dentist.', 17),
(18, 'Gezondheid en Gezondheidszorg', 'gz-zwangerschap-baby', 'Zwangerschap, bevalling en baby', 'Questions about midwives, kraamzorg, the consultatiebureau, birth registration, organ donation, and Dutch birth traditions.', 18),
(19, 'Gezondheid en Gezondheidszorg', 'gz-geestelijk-ouderenzorg', 'Geestelijke gezondheid en ouderenzorg', 'Questions about mental health support (depression, psychologist), home care for elderly (WMO), and emergency numbers (112).', 19),
(20, 'Onderwijs en Opvoeding', 'oo-schoolsysteem', 'Schoolsysteem en onderwijstypen', 'Questions about the Dutch education structure from daycare through university, including vmbo, havo, vwo, mbo, and hbo admission requirements.', 20),
(21, 'Onderwijs en Opvoeding', 'oo-leerplicht', 'Leerplicht, vakantie en verzuim', 'Questions about compulsory schooling ages (5–16), kwalificatieplicht (to 18), holiday rules, and school absence permissions.', 21),
(22, 'Onderwijs en Opvoeding', 'oo-ouders-school', 'Ouders en school betrokkenheid', 'Questions about parent-teacher conversations, ten-minute interviews, parental participation in activities, and school fees.', 22),
(23, 'Onderwijs en Opvoeding', 'oo-opvoeding-hulp', 'Opvoeding en jeugdhulp', 'Questions about parental liability for minors'' damage, child protection organisations, CJG, Raad voor Kinderbescherming, and jeugdzorg.', 23),
(24, 'Onderwijs en Opvoeding', 'oo-kinderopvang-financien', 'Kinderopvang, toeslag en kinderbijslag', 'Questions about daycare, kinderopvangtoeslag from Dienst Toeslagen, kinderbijslag from SVB, and studiefinanciering via DUO.', 24),
(25, 'Onderwijs en Opvoeding', 'oo-feestdagen', 'Nederlandse feesten en tradities', 'Questions about Dutch customs tied to education milestones and national celebrations: Sinterklaas, Kerst, Oud en Nieuw, and exam traditions.', 25),
(26, 'Werk en Inkomen', 'wi-werk-zoeken', 'Werk zoeken en solliciteren', 'Questions about finding vacancies, writing a CV and motivation letter, preparing for interviews, and the role of uitzendbureaus.', 26),
(27, 'Werk en Inkomen', 'wi-arbeidscontract', 'Arbeidscontract en arbeidsvoorwaarden', 'Questions about fixed and temporary contracts, part-time work, collective labour agreements (cao), and employment conditions.', 27),
(28, 'Werk en Inkomen', 'wi-salaris-belasting', 'Salaris, belasting en jaaropgave', 'Questions about bruto/netto salary, loonbelasting, the jaaropgave, and retaining payroll documents for the Belastingdienst.', 28),
(29, 'Werk en Inkomen', 'wi-uitkering-uwv', 'WW-uitkering, bijstand en UWV', 'Questions about unemployment benefit (WW), when and how to apply, obligations while receiving benefits, and the role of the UWV.', 29),
(30, 'Werk en Inkomen', 'wi-zelfstandige-kvk', 'Zzp, eigen bedrijf en KvK', 'Questions about starting a business, mandatory KvK registration, business plans, AOV insurance for self-employed, and pension.', 30),
(31, 'Werk en Inkomen', 'wi-vakbond-or', 'Vakbond, OR en personeelsvereniging', 'Questions about the role of trade unions, ondernemingsraad, personeelsvereniging, striking, and employee representation.', 31),
(32, 'Werk en Inkomen', 'wi-inburgering-map', 'Inburgering, MAP en diplomawaardering', 'Questions about the MAP module, IDW diploma recognition, and preparing newcomers for the Dutch labour market.', 32),
(33, 'Instanties', 'in-gemeente', 'Gemeente, BRP en gemeentelijke diensten', 'Questions about mandatory notifications to the municipality (moving, birth, death, marriage), and services like paspoort and rijbewijs.', 33),
(34, 'Instanties', 'in-belasting-digid', 'Belastingdienst, DigiD en toeslagen', 'Questions about filing tax returns, what taxes fund, DigiD usage, requesting toeslagen, and responding to Belastingdienst decisions.', 34),
(35, 'Instanties', 'in-politie-veiligheid', 'Politie, veiligheid en identificatie', 'Questions about police duties, ID obligation from age 14, when to call 112 vs 0900-8844, and stopping when ordered.', 35),
(36, 'Instanties', 'in-ind-nationaliteit', 'IND, verblijfsvergunning en naturalisatie', 'Questions about the IND, residence permits, naturalisation conditions, dual nationality rules, and BSN privacy.', 36),
(37, 'Instanties', 'in-juridisch-ombudsman', 'Juridisch Loket en ombudsman', 'Questions about the Juridisch Loket for free legal advice, the Nationale Ombudsman, and how to complain about government.', 37),
(38, 'Instanties', 'in-uitkeringen-svb', 'Uitkeringen, bijstand en SVB', 'Questions about bijstand from the municipality, WW rights and obligations, kinderbijslag from SVB, and voedselbank access.', 38),
(39, 'Staatsinrichting en Rechtsstaat', 'sr-democratie-kiesrecht', 'Democratie, verkiezingen en kiesrecht', 'Questions about active and passive voting rights, election types, who may vote in which elections, and whether voting is compulsory.', 39),
(40, 'Staatsinrichting en Rechtsstaat', 'sr-machtenscheiding', 'Machtenscheiding en rechtsstaat', 'Questions about the three branches of power, rule of law, government accountability, corruption, and appeal procedures.', 40),
(41, 'Staatsinrichting en Rechtsstaat', 'sr-grondrechten', 'Grondrechten en vrijheden', 'Questions about constitutional rights including freedom of religion, equality, privacy, freedom of expression, and self-determination.', 41),
(42, 'Staatsinrichting en Rechtsstaat', 'sr-koningshuis', 'Koningshuis, symbolen en feestdagen', 'Questions about King Willem-Alexander, Koningsdag, the Wilhelmus, and royal national symbols and traditions.', 42),
(43, 'Staatsinrichting en Rechtsstaat', 'sr-strafrecht-normen', 'Strafrecht, normen en waarden', 'Questions about what is punishable in the Netherlands (eerwraak, kindermishandeling, oproep tot geweld), legal norms, and the role of the judge.', 43);

select setval('sections_id_seq', (select max(id) from sections));

-- Update questions with section_id
update questions set section_id = case id
  when 1 then 1
  when 2 then 1
  when 3 then 2
  when 4 then 2
  when 5 then 2
  when 6 then 6
  when 7 then 2
  when 8 then 4
  when 9 then 5
  when 10 then 5
  when 11 then 5
  when 12 then 5
  when 13 then 3
  when 14 then 3
  when 15 then 3
  when 16 then 2
  when 17 then 4
  when 18 then 6
  when 19 then 4
  when 20 then 2
  when 21 then 3
  when 22 then 5
  when 23 then 2
  when 24 then 8
  when 25 then 7
  when 26 then 8
  when 27 then 7
  when 28 then 7
  when 29 then 7
  when 30 then 7
  when 31 then 7
  when 32 then 9
  when 33 then 12
  when 34 then 9
  when 35 then 10
  when 36 then 10
  when 37 then 11
  when 38 then 8
  when 39 then 7
  when 40 then 11
  when 41 then 11
  when 42 then 13
  when 43 then 13
  when 44 then 9
  when 45 then 11
  when 46 then 10
  when 47 then 10
  when 48 then 10
  when 49 then 7
  when 50 then 10
  when 51 then 9
  when 52 then 9
  when 53 then 7
  when 54 then 7
  when 55 then 7
  when 56 then 7
  when 57 then 7
  when 58 then 7
  when 59 then 8
  when 60 then 8
  when 61 then 8
  when 62 then 12
  when 63 then 7
  when 64 then 7
  when 65 then 7
  when 66 then 8
  when 67 then 7
  when 68 then 8
  when 69 then 8
  when 70 then 11
  when 71 then 8
  when 72 then 7
  when 73 then 13
  when 74 then 18
  when 75 then 18
  when 76 then 14
  when 77 then 15
  when 78 then 15
  when 79 then 16
  when 80 then 15
  when 81 then 15
  when 82 then 15
  when 83 then 17
  when 84 then 14
  when 85 then 14
  when 86 then 16
  when 87 then 19
  when 88 then 19
  when 89 then 14
  when 90 then 17
  when 91 then 18
  when 92 then 18
  when 93 then 17
  when 94 then 14
  when 95 then 14
  when 96 then 19
  when 97 then 18
  when 98 then 15
  when 99 then 16
  when 100 then 14
  when 101 then 19
  when 102 then 17
  when 103 then 14
  when 104 then 23
  when 105 then 23
  when 106 then 20
  when 107 then 21
  when 108 then 20
  when 109 then 20
  when 110 then 21
  when 111 then 21
  when 112 then 21
  when 113 then 22
  when 114 then 22
  when 115 then 21
  when 116 then 20
  when 117 then 20
  when 118 then 20
  when 119 then 24
  when 120 then 21
  when 121 then 22
  when 122 then 25
  when 123 then 25
  when 124 then 23
  when 125 then 20
  when 126 then 21
  when 127 then 25
  when 128 then 25
  when 129 then 30
  when 130 then 26
  when 131 then 27
  when 132 then 27
  when 133 then 26
  when 134 then 28
  when 135 then 28
  when 136 then 28
  when 137 then 26
  when 138 then 26
  when 139 then 32
  when 140 then 26
  when 141 then 27
  when 142 then 27
  when 143 then 27
  when 144 then 30
  when 145 then 31
  when 146 then 27
  when 147 then 27
  when 148 then 28
  when 149 then 26
  when 150 then 29
  when 151 then 29
  when 152 then 27
  when 153 then 30
  when 154 then 27
  when 155 then 27
  when 156 then 30
  when 157 then 27
  when 158 then 29
  when 159 then 32
  when 160 then 27
  when 161 then 30
  when 162 then 27
  when 163 then 31
  when 164 then 32
  when 165 then 28
  when 166 then 26
  when 167 then 29
  when 168 then 29
  when 169 then 27
  when 170 then 30
  when 171 then 27
  when 172 then 27
  when 173 then 35
  when 174 then 33
  when 175 then 33
  when 176 then 36
  when 177 then 36
  when 178 then 33
  when 179 then 34
  when 180 then 34
  when 181 then 34
  when 182 then 34
  when 183 then 34
  when 184 then 35
  when 185 then 35
  when 186 then 35
  when 187 then 37
  when 188 then 34
  when 189 then 37
  when 190 then 37
  when 191 then 35
  when 192 then 38
  when 193 then 33
  when 194 then 34
  when 195 then 33
  when 196 then 33
  when 197 then 34
  when 198 then 34
  when 199 then 38
  when 200 then 37
  when 201 then 34
  when 202 then 33
  when 203 then 34
  when 204 then 35
  when 205 then 38
  when 206 then 33
  when 207 then 34
  when 208 then 39
  when 209 then 39
  when 210 then 39
  when 211 then 40
  when 212 then 40
  when 213 then 40
  when 214 then 40
  when 215 then 40
  when 216 then 42
  when 217 then 40
  when 218 then 40
  when 219 then 41
  when 220 then 41
  when 221 then 41
  when 222 then 41
  when 223 then 43
  when 224 then 41
  when 225 then 41
  when 226 then 39
  when 227 then 41
  when 228 then 41
  when 229 then 40
  when 230 then 43
  when 231 then 2
  when 232 then 2
  when 233 then 2
  when 234 then 2
  when 235 then 2
  when 236 then 2
  when 237 then 2
  when 238 then 1
  when 239 then 1
  when 240 then 1
  when 241 then 1
  when 242 then 1
  when 243 then 1
  when 244 then 4
  when 245 then 4
  when 246 then 4
  when 247 then 4
  when 248 then 6
  when 249 then 6
  when 250 then 3
  when 251 then 3
  when 252 then 3
  when 253 then 6
  when 254 then 6
  when 255 then 4
  when 256 then 4
  when 257 then 5
  when 258 then 5
  when 259 then 8
  when 260 then 7
  when 261 then 8
  when 262 then 8
  when 263 then 8
  when 264 then 8
  when 265 then 8
  when 266 then 8
  when 267 then 13
  when 268 then 13
  when 269 then 13
  when 270 then 7
  when 271 then 7
  when 272 then 7
  when 273 then 7
  when 274 then 7
  when 275 then 7
  when 276 then 7
  when 277 then 12
  when 278 then 12
  when 279 then 12
  when 280 then 12
  when 281 then 12
  when 282 then 10
  when 283 then 10
  when 284 then 10
  when 285 then 10
  when 286 then 11
  when 287 then 12
  when 288 then 11
  when 289 then 14
  when 290 then 14
  when 291 then 14
  when 292 then 19
  when 293 then 14
  when 294 then 14
  when 295 then 14
  when 296 then 14
  when 297 then 17
  when 298 then 17
  when 299 then 17
  when 300 then 19
  when 301 then 16
  when 302 then 16
  when 303 then 16
  when 304 then 17
  when 305 then 17
  when 306 then 15
  when 307 then 15
  when 308 then 15
  when 309 then 15
  when 310 then 18
  when 311 then 18
  when 312 then 18
  when 313 then 18
  when 314 then 20
  when 315 then 20
  when 316 then 20
  when 317 then 20
  when 318 then 20
  when 319 then 22
  when 320 then 22
  when 321 then 22
  when 322 then 22
  when 323 then 20
  when 324 then 20
  when 325 then 21
  when 326 then 23
  when 327 then 23
  when 328 then 23
  when 329 then 23
  when 330 then 23
  when 331 then 23
  when 332 then 23
  when 333 then 24
  when 334 then 24
  when 335 then 24
  when 336 then 24
  when 337 then 24
  when 338 then 24
  when 339 then 32
  when 340 then 26
  when 341 then 26
  when 342 then 26
  when 343 then 26
  when 344 then 26
  when 345 then 26
  when 346 then 26
  when 347 then 27
  when 348 then 27
  when 349 then 27
  when 350 then 27
  when 351 then 27
  when 352 then 29
  when 353 then 28
  when 354 then 28
  when 355 then 31
  when 356 then 31
  when 357 then 31
  when 358 then 31
  when 359 then 31
  when 360 then 31
  when 361 then 31
  when 362 then 31
  when 363 then 30
  when 364 then 29
  when 365 then 30
  when 366 then 30
  when 367 then 29
  when 368 then 30
  when 369 then 30
  when 370 then 38
  when 371 then 38
  when 372 then 38
  when 373 then 38
  when 374 then 33
  when 375 then 33
  when 376 then 36
  when 377 then 36
  when 378 then 36
  when 379 then 36
  when 380 then 35
  when 381 then 36
  when 382 then 35
  when 383 then 35
  when 384 then 35
  when 385 then 35
  when 386 then 37
  when 387 then 37
  when 388 then 37
  when 389 then 37
  when 390 then 37
  when 391 then 43
  when 392 then 43
  when 393 then 40
  when 394 then 40
  when 395 then 39
  when 396 then 39
  when 397 then 39
  when 398 then 39
  when 399 then 39
  when 400 then 39
  when 401 then 42
  when 402 then 42
  when 403 then 42
  when 404 then 42
  when 405 then 42
  when 406 then 40
  when 407 then 40
  when 408 then 43
  when 409 then 40
  when 410 then 43
  when 411 then 41
  when 412 then 41
  when 413 then 41
  when 414 then 41
  when 415 then 43
  when 416 then 41
  when 417 then 41
  when 418 then 41
end
where id in (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418);
