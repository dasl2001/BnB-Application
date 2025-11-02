# Booking-Application

Detta projekt är ett **Next.js och Hono API** som hanterar **registrering**, **autentisering**, **annonser (properties)** och **bokningar (bookings)** med **Supabase** som backend.


---

## AUTH

**POST** `/api/auth/register`  
Registrera ny användare  

**POST** `/api/auth/login`  
Logga in och hämta access token 

---

### Viktigt innan du loggar in

Lägg till följande i **Headers** i Postman eller i din HTTP-klient:

| Key | Value |
|-----|--------|
| **Content-Type** | `application/json` |
| **apikey** | `<YOUR_SUPABASE_ANON_KEY>` |

---

## PROPERTIES

**GET** `/api/properties`  
Hämta alla properties  

**GET** `/api/properties/:id`  
Hämta en property  

**GET** `/api/properties/my`  
Hämta användarens egna properties  

**GET** `/api/properties/others`  
Hämta andras (bokningsbara) properties  

**POST** `/api/properties`  
Skapa en ny property  

**PATCH** `/api/properties/:id`  
Uppdatera en property  

**DELETE** `/api/properties/:id`  
Ta bort en property  

**GET** `/api/properties/:id/is-booked`  
Kontrollera om en property är bokad  

---

## BOOKINGS 

**GET** `/api/bookings`  
Hämta användarens bokningar  

**GET** `/api/bookings/:id`  
Hämta en specifik bokning  

**POST** `/api/bookings`  
Skapa en ny bokning  

**PATCH** `/api/bookings/:id`  
Uppdatera en bokning  

**DELETE** `/api/bookings/:id`  
Ta bort en bokning  

---

## Authorization

Alla skyddade rutter kräver en giltig JWT-token i headern:
Authorization: Bearer <access_token>

---

# Hur man kör applikationen lokalt

### 1. Klona projektet
```bash
git clone <repo-url>
cd booking-application

### 2. Installera beroenden
npm install

### 3. Skapa miljöfil .env.local
Lägg till dina Supabase-nycklar:
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

4. Starta utvecklingsservern
npm run dev

