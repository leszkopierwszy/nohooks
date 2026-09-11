# Wersja PHP z FPM
FROM php:8.4-fpm

# Ustaw katalog roboczy
WORKDIR /var/www/html

# Zainstaluj zależności systemowe potrzebne do Laravel i PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    zip \
    unzip \
    libpq-dev \
    curl \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_pgsql gd \
    && rm -rf /var/lib/apt/lists/*

# Laravel waliduje do 5 MB (max:5120); domyślne PHP w obrazie to 2M — bez tego: „new_images.0 failed to upload”.
RUN echo "upload_max_filesize = 12M" > /usr/local/etc/php/conf.d/99-uploads.ini \
    && echo "post_max_size = 16M" >> /usr/local/etc/php/conf.d/99-uploads.ini

# Zainstaluj composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Skopiuj cały projekt Laravel (Docker build będzie działał, bo masz lokalnie pliki)
COPY . .

# Zainstaluj zależności PHP
RUN composer install --no-interaction --prefer-dist

# Wystaw port 8000
EXPOSE 8000

# Domyślna komenda: start serwera Laravel
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]