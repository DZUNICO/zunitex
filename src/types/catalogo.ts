export interface AtributosTecnicos {
  polos?: number | null;
  corriente_a?: number | null;
  ruptura_ka?: number | null;
  sensibilidad_ma?: number | null;
  tension_bobina_v?: number | null;
  diametro_pulg?: string | number | null;
  con_usb?: boolean | null;
  potencia_kw?: number | null;
  [key: string]: unknown; // claves futuras no mapeadas
}

export interface ProductoCatalogo {
  id: string;
  marca: string;
  modelo: string;
  descripcion: string;
  categoria: string;
  codigo_fabricante?: string | null;
  slug?: string | null;
  atributos?: AtributosTecnicos | null;
  precio_ref_usd?: number | null;
  precio_ref_pen?: number | null; // usado en página de detalle
  imagen_url?: string | null;
  ficha_tecnica_pdf?: string | null;
  disponible_peru?: boolean | null;
}
