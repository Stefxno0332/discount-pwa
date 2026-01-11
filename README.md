# Amazon Discount PWA

Una Progressive Web App completa per il monitoraggio degli sconti su Amazon Italia, con notifiche in tempo reale e condivisione automatica sui social media.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-20-green) ![Stack](https://img.shields.io/badge/MongoDB-7-darkgreen) ![Stack](https://img.shields.io/badge/TailwindCSS-3-cyan)

## 🚀 Funzionalità

### Core
- ✅ **Catalogo Prodotti** con sconti da Amazon Italia
- ✅ **Filtri Avanzati** per categoria, prezzo, sconto minimo
- ✅ **Ricerca Testuale** con autocomplete
- ✅ **Storico Prezzi** con grafici interattivi
- ✅ **Confronto Prodotti** side-by-side
- ✅ **Dark Mode** con persistenza

### PWA
- ✅ **Installabile** come app nativa
- ✅ **Offline Support** con Service Worker
- ✅ **Push Notifications** nel browser

### Notifiche
- ✅ **Push Browser** via Web Push API
- ✅ **WhatsApp** via Twilio API
- ✅ **Personalizzabili** per sconto minimo

### Condivisione Social
- ✅ **Telegram** Bot API
- ✅ **Reddit** API (Snoowrap)
- ✅ **Facebook/Instagram** Meta Graph API
- ✅ **Twitter/X** API v2

### Extra
- ✅ **Export CSV/PDF** della watchlist
- ✅ **Sistema Ranking** per migliori offerte
- ✅ **Responsive Design** mobile-first

---

## 📋 Prerequisiti

- **Node.js** 18+ e npm
- **MongoDB** 6+ (o Docker)
- **Redis** (opzionale, per caching)

### API Keys Necessarie

| Servizio | Uso | Link Registrazione |
|----------|-----|-------------------|
| Amazon PA-API | Prodotti e link affiliati | [Amazon Associates](https://affiliate-program.amazon.it/) |
| Twilio | Notifiche WhatsApp | [Twilio Console](https://console.twilio.com/) |
| Telegram | Bot per posting | [@BotFather](https://t.me/botfather) |
| Reddit | Posting su subreddit | [Reddit Apps](https://www.reddit.com/prefs/apps) |
| Meta | Facebook/Instagram | [Meta Developers](https://developers.facebook.com/) |
| Twitter | Tweet automatici | [Twitter Developer](https://developer.twitter.com/) |

---

## ⚡ Installazione Rapida

### Con Docker (Raccomandato)

```bash
# Clona il repository
cd "Scraper amazon"

# Crea file .env per il backend
cp backend/.env.example backend/.env
# Modifica backend/.env con le tue API keys

# Avvia tutto con Docker
docker-compose up -d

# App disponibile su http://localhost:3000
```

### Manuale (Sviluppo)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Configura le variabili in .env
npm run dev

# Frontend (nuovo terminale)
cd frontend
npm install
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

---

## ⚙️ Configurazione

### Variabili d'Ambiente Backend

Copia `backend/.env.example` in `backend/.env` e configura:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/amazon-discount-pwa
REDIS_URL=redis://localhost:6379

# JWT (genera una stringa sicura)
JWT_SECRET=your-super-secret-key-min-32-chars

# Amazon PA-API (OBBLIGATORIO)
AMAZON_ACCESS_KEY=your-access-key
AMAZON_SECRET_KEY=your-secret-key
AMAZON_PARTNER_TAG=tuotag-21

# Push Notifications (genera con: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tua@email.com

# Twilio WhatsApp (opzionale)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Social (opzionali)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=@tuocanale
# ... vedi .env.example per tutti
```

### Generare VAPID Keys

```bash
npx web-push generate-vapid-keys
```

---

## 🔧 Comandi Disponibili

### Backend

```bash
npm run dev      # Sviluppo con hot-reload
npm start        # Produzione
npm test         # Test
```

### Frontend

```bash
npm run dev      # Sviluppo
npm run build    # Build produzione
npm run preview  # Preview build
```

### Docker

```bash
docker-compose up -d      # Avvia tutto
docker-compose logs -f    # Vedi logs
docker-compose down       # Ferma tutto
docker-compose down -v    # Ferma e rimuovi volumi
```

---

## 📱 Configurazione Social

### Telegram Bot

1. Parla con [@BotFather](https://t.me/botfather)
2. Crea un nuovo bot con `/newbot`
3. Copia il token in `TELEGRAM_BOT_TOKEN`
4. Crea un canale e aggiungi il bot come admin
5. Imposta `TELEGRAM_CHANNEL_ID` (@nomecanale o ID numerico)

### WhatsApp (Twilio)

1. Crea account su [Twilio](https://console.twilio.com/)
2. Attiva WhatsApp Sandbox in Messaging > Try it Out
3. Copia Account SID e Auth Token
4. Il numero sandbox è `whatsapp:+14155238886`

### Reddit

1. Vai su [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Crea una "script" application
3. Copia Client ID e Secret
4. Usa un account dedicato per il posting

### Meta (Facebook/Instagram)

1. Crea app su [Meta Developers](https://developers.facebook.com/)
2. Aggiungi Facebook Login e Instagram Graph API
3. Genera Page Access Token con permessi `publish_pages`
4. Per Instagram serve un account Business collegato

### Twitter/X

1. Crea progetto su [Twitter Developer Portal](https://developer.twitter.com/)
2. Genera API Keys e Access Tokens
3. Abilita OAuth 2.0 con Read and Write permissions

---

## 🏗️ Architettura

```
amazon-discount-pwa/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, env
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, errors
│   │   ├── services/
│   │   │   ├── amazon/      # PA-API + scheduler
│   │   │   ├── notifications/ # Push, WhatsApp
│   │   │   └── social/      # Telegram, Reddit, etc.
│   │   └── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route pages
│   │   ├── store/           # Zustand state
│   │   └── services/        # API client
│   ├── public/              # PWA assets
│   └── Dockerfile
└── docker-compose.yml
```

---

## 📡 API Endpoints

### Prodotti
- `GET /api/products` - Lista con filtri e paginazione
- `GET /api/products/:id` - Dettaglio prodotto
- `GET /api/products/:id/price-history` - Storico prezzi
- `GET /api/products/meta/categories` - Lista categorie
- `GET /api/products/meta/stats` - Statistiche
- `GET /api/products/meta/top-deals` - Top offerte

### Utenti
- `POST /api/users/register` - Registrazione
- `POST /api/users/login` - Login
- `GET /api/users/profile` - Profilo utente
- `GET /api/users/watchlist` - Watchlist
- `POST /api/users/watchlist/:id` - Aggiungi a watchlist
- `PUT /api/users/notifications` - Impostazioni notifiche

### Admin
- `POST /api/admin/sync` - Trigger sync manuale
- `POST /api/admin/share-daily` - Condividi top deals

---

## 🔒 Note sulla Sicurezza

- Le password sono hashate con bcrypt (12 rounds)
- Autenticazione via JWT con scadenza 7 giorni
- Rate limiting su tutte le API (100 req/15min)
- CORS configurato per il frontend
- Helmet per headers di sicurezza

---

## 📄 Licenza

MIT License - Usa liberamente per progetti personali e commerciali.

---

## 🆘 Troubleshooting

### MongoDB non si connette
```bash
# Verifica che MongoDB sia in esecuzione
mongosh
# Oppure usa Docker
docker-compose up -d mongodb
```

### Push notifications non funzionano
1. Verifica VAPID keys generate correttamente
2. Controlla che il browser supporti Push API
3. Verifica permessi notifiche nel browser

### Errori Amazon PA-API
- Verifica di avere almeno 3 vendite negli ultimi 180 giorni
- Controlla che le chiavi siano per il marketplace corretto (amazon.it)
- Rispetta i rate limits (1 req/sec iniziale)
