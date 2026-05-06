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
  familia?: string | null;
  uso?: string | null;
  fases?: string | null;
  normas?: string | null;
  precio_ref_pen?: number | null;
  atributos?: AtributosTecnicos | null;
  ficha_tecnica_pdf?: string | null;
  pagina_oficial?: string | null;
  manual_pdf?: string | null;
  imagen_url?: string | null;
  slug?: string | null;
}
