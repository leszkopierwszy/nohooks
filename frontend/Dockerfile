# Używamy Node 20 (Vite, Vue 3)
FROM node:20

WORKDIR /app

# Kopiujemy package.json i package-lock.json jeśli są (przyspiesza build)
COPY package*.json ./

# Instalacja zależności
RUN npm install

# Kopiowanie reszty projektu
COPY . .

# Expose port Vite dev server
EXPOSE 5173

# Domyślna komenda: start dev server
CMD ["npm", "run", "dev", "--", "--host"]