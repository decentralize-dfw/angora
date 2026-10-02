#!/usr/bin/env bash
# Web sizes for the presentation site (../en/media). Sources are the listing
# photographs in photogallery/ (1600 px originals), the Cycles renders in
# build/renders and the application screenshots in build/qa/final-current.
# Everything else on the page uses the already optimised assets/galeri files.
set -euo pipefail
cd "$(dirname "$0")/../.."
out=en/media
mkdir -p "$out"
photo() { # photo <source> <name> <max-width>
  convert "$1" -auto-orient -strip -resize "$3x$3>" -quality 82 "$out/$2.webp"
}
render() { # render <source png> <name>
  convert "$1" -strip -quality 86 "$out/$2.webp"
}
crop() { # crop <source png> <name> <geometry> <max-width>
  convert "$1" -crop "$3" +repage -strip -resize "$4x>" -quality 84 "$out/$2.webp"
}
# Full-bleed photographs
photo photogallery/angora_25.jpg hero-1600 1600
photo photogallery/angora_25.jpg hero-960 960
photo photogallery/angora_26.jpg aerial-26-1600 1600
photo photogallery/angora_24.jpg aerial-24-1600 1600
photo photogallery/angora_51.jpg terrace-51-1600 1600
photo photogallery/angora_55.jpg city-55-1200 1200
photo photogallery/angora_42.jpg stairs-42-1200 1200
# Model renders (Cycles, build/renders)
render build/renders/02_pool.png render-pool
render build/renders/01_front.png render-front
render build/renders/03_neighborhood.png render-neighborhood
# Application screenshots, interface chrome cropped away
crop build/qa/final-current/desktop/C07.png app-plan-first 1200x680+260+90 1200
crop build/qa/final-current/desktop/C05.png app-plan-basement 1200x680+260+90 1200
crop build/qa/final-current/desktop/C01.png region-map 1120x670+240+90 1120
ls -la "$out"
