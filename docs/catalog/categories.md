# Taxonomia catalogului

Arborele de categorii, tipul de compatibilitate al fiecărei categorii și faza în care intră în magazin.
Modelul de date e descris în [ADR-006](../decisions/006-compatibility-engine.md) și [ADR-008](../decisions/008-devices-and-fitment.md).

## Legendă

**Tip compatibilitate**

- **F** — fitment explicit: produsul are o listă de modele de dispozitive pe care se potrivește.
- **A** — reguli pe atribute: produs ↔ produs sau produs ↔ dispozitiv, pe baza unui standard.
- **F+A** — ambele (de ex. husa se potrivește pe model **și** are atributul MagSafe).
- **—** — fără compatibilitate: doar specificații și ghid de utilizare.

**Fază**

- **1** — MVP
- **2** — după MVP, când motorul e validat
- **3** — mai târziu sau doar dacă datele o permit
- **✗** — nerecomandat în dropshipping (vezi notele de la final)

Câmpul „Față de” spune cu ce se compară produsul: alt produs (P) sau un dispozitiv (D).

---

## 1. Telefoane și tablete

| Subcategorie                 | Tip | Atribute cheie                                                            | Față de                      | Fază  |
| ---------------------------- | --- | ------------------------------------------------------------------------- | ---------------------------- | ----- |
| Telefoane (vânzare)          | —   | brand, model, stocare, RAM, culoare                                       | —                            | ✗     |
| Tablete (vânzare)            | —   | idem                                                                      | —                            | ✗     |
| Huse telefon                 | F+A | tip (back / flip / bumper), material, MagSafe                             | D: model; D: `magsafe`       | **1** |
| Folii și sticlă de protecție | F   | tip (tempered / hidrogel / privacy), acoperire completă, protecție cameră | D: model                     | **1** |
| Huse tabletă                 | F   | tip, suport stylus                                                        | D: model                     | 2     |
| Stylus                       | F+A | generație, protocol (Apple Pencil 1/2/USB-C/Pro, USI, S Pen)              | D: model / protocol suportat | 2     |
| Carduri de memorie           | A   | format (microSD / SD), capacitate, clasă (U3, V30, A2)                    | D: `sd_slot`, `max_card_gb`  | 2     |
| Suporturi auto / birou       | A   | lățime min–max (mm), MagSafe, montaj (grilă / bord / ventuză)             | D: lățime (mm), `magsafe`    | 2     |

## 2. Încărcare și cabluri

| Subcategorie                 | Tip | Atribute cheie                                                                              | Față de                                     | Fază  |
| ---------------------------- | --- | ------------------------------------------------------------------------------------------- | ------------------------------------------- | ----- |
| Încărcătoare de priză        | A   | porturi (nr. × USB-C / USB-A), putere totală și per port (W), protocoale (PD 3.0, PPS, QC)  | D: conector, putere max (W), protocol cerut | **1** |
| Cabluri                      | A   | capăt A / capăt B, putere max (60 / 100 / 240 W, e-marker), date (USB 2.0 / 3.x / 4), video | P: port încărcător; D: conector             | **1** |
| Încărcătoare wireless        | A   | standard (Qi / Qi2 / MagSafe), putere (W), dispozitive simultane                            | D: `wireless_charging`, standard            | **1** |
| Baterii externe (power bank) | A   | capacitate (mAh **și** Wh), ieșire (W), porturi, PD/PPS                                     | D: conector, protocol                       | **1** |
| Încărcătoare auto            | A   | idem încărcătoare de priză + 12/24 V                                                        | D: idem                                     | 2     |
| Adaptoare și hub-uri USB-C   | A   | porturi, HDMI (versiune, 4K@60), power delivery pass-through                                | D: `usbc_video_out`                         | 2     |
| Încărcătoare laptop          | A   | conector (USB-C PD / barrel cu diametre / proprietar), tensiune (V), putere (W)             | D: conector, V, W                           | 2     |

> **Exemple de `partial`**:
>
> - Galaxy S24 Ultra + încărcător PD fără PPS: încarcă, dar nu la 45 W.
> - Telefon fără ieșire video pe USB-C + hub HDMI: încarcă prin hub, dar nu afișează nimic. Asta e `near_miss` pentru funcția principală.

## 3. Laptopuri și PC

| Subcategorie         | Tip | Atribute cheie                                                                 | Față de                                             | Fază |
| -------------------- | --- | ------------------------------------------------------------------------------ | --------------------------------------------------- | ---- |
| Laptopuri (vânzare)  | —   | —                                                                              | —                                                   | ✗    |
| Memorie RAM          | A   | tip (DDR4 / DDR5 / LPDDR), format (SO-DIMM / DIMM), frecvență, capacitate      | D: tip RAM, sloturi libere, `ram_soldered`, RAM max | 2    |
| SSD                  | A   | format M.2 (2230 / 2242 / 2280), interfață (NVMe / SATA), PCIe gen, capacitate | D: slot M.2 (lungime, interfață)                    | 2    |
| Genți și huse laptop | A   | dimensiune interioară (mm), diagonală (inch)                                   | D: dimensiuni (mm)                                  | 2    |
| Docking stations     | A   | conexiune (USB-C / Thunderbolt 3/4 / USB4), monitoare externe, PD              | D: port, `usbc_video_out`, Thunderbolt              | 2    |
| Mouse și tastaturi   | A   | conexiune (BT / 2.4 GHz / USB), layout (RO / US)                               | D: Bluetooth                                        | 2    |
| Baterii laptop       | F   | part number, celule, Wh                                                        | D: model + part number                              | 3    |

## 4. Imprimante și consumabile

| Subcategorie      | Tip | Atribute cheie                                                     | Față de                          | Fază |
| ----------------- | --- | ------------------------------------------------------------------ | -------------------------------- | ---- |
| Cartușe și tonere | F   | cod cartuș (de ex. HP 305), original / compatibil, culoare, pagini | D: model de imprimantă           | 2    |
| Hârtie            | A   | format (A4 / A6 / 10×15), gramaj, tip (foto / standard)            | D: gramaj max, formate suportate | 3    |

## 5. Electrocasnice: consumabile și piese

| Subcategorie                   | Tip | Atribute cheie                                                       | Față de                   | Fază |
| ------------------------------ | --- | -------------------------------------------------------------------- | ------------------------- | ---- |
| Saci și filtre de aspirator    | F   | cod sac / filtru, tip (HEPA etc.)                                    | D: model de aspirator     | 2    |
| Filtre de apă (cană, frigider) | F   | sistem (Brita Maxtra Pro, Dafi Unimax…), durată                      | D: model cană / frigider  | 2    |
| Capsule de cafea               | A   | sistem (Nespresso Original / Vertuo / Dolce Gusto / Tassimo / K-fee) | D: sistemul espressorului | 2    |
| Accesorii roboți de bucătărie  | F   | —                                                                    | D: model                  | 3    |

## 6. Iluminat și electric

| Subcategorie              | Tip | Atribute cheie                                                                                     | Față de                                                 | Fază |
| ------------------------- | --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| Becuri                    | A   | dulie (E27 / E14 / GU10 / G9 / MR16-12 V), putere (W), lumeni, temperatură (K), dimabil            | P: corp de iluminat (dulie, putere max), variator (tip) | 2    |
| Baterii                   | A   | format (AA / AAA / C / D / 9 V / CR2032 / CR2025), chimie (alcalină / NiMH / litiu), reîncărcabilă | D: tip baterie                                          | 2    |
| Prelungitoare și prize    | A   | standard (Schuko), putere max (W), protecție                                                       | —                                                       | 2    |
| Prize smart și smart home | A   | protocol (Wi-Fi / Zigbee / Thread / Matter), aplicație                                             | P: hub (protocol)                                       | 3    |

## 7. Feronerie și scule

| Subcategorie                         | Tip | Atribute cheie                                                                                | Față de                  | Fază |
| ------------------------------------ | --- | --------------------------------------------------------------------------------------------- | ------------------------ | ---- |
| Șuruburi, piulițe, șaibe             | A   | filet (M), pas (mm), lungime, cap, antrenare (PH / PZ / Torx / imbus + mărime), material      | P: între ele, bit, diblu | 2    |
| Dibluri                              | A   | diametru, lungime, material suport (beton / cărămidă / BCA / rigips), interval diametru șurub | P: șurub, burghiu        | 2    |
| Burghie                              | A   | diametru, material țintă (lemn / metal / beton), coadă (SDS-plus / hex / cilindrică)          | P: diblu; D: mandrină    | 2    |
| Biți                                 | A   | antrenare + mărime, coadă (1/4" hex)                                                          | P: șurub                 | 2    |
| Acumulatori și încărcătoare de scule | A   | platformă (Makita LXT, DeWalt XR, Bosch PBA, Parkside X20V…), tensiune, Ah                    | D: platformă             | 3    |
| Scule manuale                        | —   | —                                                                                             | —                        | 2    |

## 8. Auto

| Subcategorie                                     | Tip                      | Atribute cheie                                                   | Față de                             | Fază                                 |
| ------------------------------------------------ | ------------------------ | ---------------------------------------------------------------- | ----------------------------------- | ------------------------------------ |
| Becuri auto                                      | A                        | soclu (H1 / H4 / H7 / H11 / W5W…), tip (halogen / LED, omologat) | P: soclu (clientul își știe soclul) | 3                                    |
| Fitment pe model de mașină (becuri, ștergătoare) | F                        | —                                                                | D: marcă / model / an               | ✗ până la o sursă licențiată de date |
| Încărcătoare și suporturi auto                   | → vezi secțiunile 1 și 2 |                                                                  |                                     |                                      |

## 9. Casă și bucătărie

| Subcategorie             | Tip | Atribute cheie                     | Față de      | Fază |
| ------------------------ | --- | ---------------------------------- | ------------ | ---- |
| Vase și tigăi            | A   | compatibil inducție, diametru bază | D: tip plită | 2    |
| Ustensile de bucătărie   | —   | —                                  | —            | 2    |
| Organizare și depozitare | —   | dimensiuni                         | —            | 2    |
| Curățenie                | —   | —                                  | —            | 2    |

## 10. Grădină

| Subcategorie                | Tip | Atribute cheie                                                             | Față de      | Fază |
| --------------------------- | --- | -------------------------------------------------------------------------- | ------------ | ---- |
| Furtunuri, conectori, cuple | A   | diametru (1/2" / 5/8" / 3/4"), sistem (Gardena / universal), filet robinet | P: între ele | 3    |
| Restul grădinii             | —   | —                                                                          | —            | 3    |

## 11. Outdoor și camping, Cadouri

| Subcategorie       | Tip                 | Fază |
| ------------------ | ------------------- | ---- |
| Lanterne, frontale | A (baterii: format) | 3    |
| Restul             | —                   | 3    |

---

## Catalogul de dispozitive de referință (nu se vând)

| Categorie dispozitiv                           | Necesar pentru                                      | Fază  | Seed                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `phone`                                        | huse, folii, încărcare, cabluri, carduri, suporturi | **1** | ~100 de modele relevante în RO: Apple, Samsung, Xiaomi/Redmi/POCO, Motorola, Google, OnePlus, Huawei/Honor |
| `tablet`                                       | huse, stylus, încărcare                             | 2     | iPad, Galaxy Tab, Xiaomi Pad                                                                               |
| `laptop`                                       | RAM, SSD, încărcătoare, docking, genți              | 2     | serii populare: ThinkPad, Latitude, ProBook/EliteBook, MacBook, IdeaPad, Vivobook                          |
| `printer`                                      | cartușe                                             | 2     | după ce aduce feed-ul                                                                                      |
| `vacuum`, `water_filter_jug`, `coffee_machine` | consumabile                                         | 2     | după ce aduce feed-ul                                                                                      |
| `power_tool_platform`                          | acumulatori                                         | 3     | 6–8 platforme                                                                                              |

---

## Ce intră în MVP (Faza 1) și de ce

**Accesorii de telefon (huse, folii) + Încărcare și cabluri (încărcătoare, cabluri, wireless, power bank)**, plus catalogul de telefoane.

- **Testează ambele mecanisme** pe un singur tip de dispozitiv: fitment (husă → model) și reguli pe atribute cu statusul `partial` (încărcător → telefon).
- **Cerere mare și căutări explicite**: „husa iphone 15 pro”, „incarcator samsung s24 rapid”.
- **Furnizori de dropshipping din belșug** pentru accesorii GSM în RO.
- **Valoare mică pe comandă**: risc mic de fraudă cu cardul, transport ieftin, retururi ieftine.
- „Dispozitivele mele” are sens din prima zi: un singur telefon salvat filtrează tot magazinul.

## De ce nu se vând telefoane și laptopuri prin dropshipping (✗)

- **Marjă mică**: tipic sub 10% la electronice mari, față de multiple zeci de procente la accesorii (ordine de mărime, de verificat cu furnizorii reali).
- **Concurență directă pe preț** cu eMAG, Altex, Flanco.
- **Fraudă și chargeback-uri** la plata cu cardul pe sume mari. Un chargeback pierdut = produsul și banii.
- **Garanție și produse defecte la livrare**: legal, tu răspunzi față de client, iar furnizorul de dropshipping poate răspunde lent sau deloc.

Ca **dispozitive de referință** apar de la Faza 1. Dacă vreodată se vând, produsul se leagă de dispozitivul existent (`products.device_id`), fără schimbare de model.
