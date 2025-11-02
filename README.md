# Booking-Application

Detta projekt är byggt med **Next.js**, **Hono API** och **Supabase** som backend.  
Applikationen är skriven i **TypeScript** helt utan användning av `any` vilket ger robust typning och bättre utvecklarupplevelse.

Projektet är utformat för att efterlikna en **bnb-hanteringsapplikation**, där användare kan:
- **Registrera sig och**
- **Logga in**  
- **Skapa, redigera och ta bort sina egna annonser (CRUD)**
- **Se andra användares boenden**
- **Boka tillgängliga boenden**
- **Hantera sina bokningar (CRUD)**

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

# Kör applikationen lokalt

### 1. Klona projektet
git clone <repo-url>

### 2. Installera paket
npm install

### 3. Skapa miljöfil .env
Lägg till dina Supabase-nycklar:  
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>  
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

### 4. Starta utvecklingsservern
npm run dev

