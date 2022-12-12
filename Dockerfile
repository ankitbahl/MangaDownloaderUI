FROM node:16
WORKDIR '/app'
COPY . .
RUN apt update
RUN apt install -y calibre openjdk-11-jdk-headless/oldstable imagemagick/oldstable 
RUN sed -i 's/<policy domain="coder" rights="none" pattern="PDF" \/>/<policy domain="coder" rights="write" pattern="PDF" \/>/' /etc/ImageMagick-6/policy.xml

RUN git clone https://github.com/ankitbahl/MangaDownloader.git
WORKDIR MangaDownloader
RUN wget https://dlcdn.apache.org/maven/maven-3/3.8.6/binaries/apache-maven-3.8.6-bin.zip
RUN unzip apache-maven-3.8.6-bin.zip

RUN apache-maven-3.8.6/bin/mvn compile
RUN apache-maven-3.8.6/bin/mvn package

WORKDIR '/app'
RUN mkdir MangaDownloaderAPI
RUN cp MangaDownloader/target/manga-downloader-0.1.0.jar MangaDownloaderAPI/

RUN npm install
RUN npm run build

CMD ["node", "server.js"]
