FROM php:8.2-fpm

# Set working directory
WORKDIR /var/www/html

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    libzip-dev \
    libonig-dev \
    libxml2-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install dependencies for WebP support
RUN apt-get update && apt-get install -y \
    libwebp-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) gd
# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Add user for Laravel application
RUN groupadd -g 1000 www
RUN useradd -u 1000 -ms /bin/bash -g www www

# Copy existing application directory contents
COPY . /var/www/html

# Install additional tools for database connectivity
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Create a startup script
COPY --chown=www:www . /var/www/html

# Change current user to www
USER www

# Install PHP dependencies
RUN composer install

# Expose port 8000
EXPOSE 8000

# Ensure storage permissions
USER root
RUN mkdir -p /var/www/html/storage/app/public/rooms && \
    chown -R www:www /var/www/html/storage && \
    chmod -R 777 /var/www/html/storage

# Copy and setup startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

USER www

# Start Laravel development server
CMD ["/start.sh"]
