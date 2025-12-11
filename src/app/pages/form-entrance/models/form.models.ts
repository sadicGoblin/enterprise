// Interfaces para el formulario dinámico

export interface FormValue {
  value: string | number;
  text: string;
}

export interface SubParam {
  opt: string;
  values: FormValue[];
}

export interface AllowPictures {
  max: number;
  min: number;
}

export interface QueryValues {
  id: string;
}

export interface FormQuestion {
  id: string;
  name: string;
  type: 'hidden' | 'select_parent' | 'select' | 'text' | 'multiple_choice' | 'picture';
  values: FormValue[];
  required: boolean;
  allow_comment: boolean;
  order: number;
  read_only?: boolean;
  sub_params?: SubParam[];
  query_values?: QueryValues;
  allow_pictures?: AllowPictures;
}

export interface FormData {
  questions: FormQuestion[];
  form_id: string;
  version: string;
  read_only: boolean;
}

export interface FormResponse {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  instructions: string;
  form_read_only: boolean | null;
  button_action: string;
  form: FormData;
}

export interface ApiResponse {
  success: boolean;
  code: number;
  message: string;
  data: FormResponse;
}

// Interfaz para el valor del formulario que se enviará
export interface FormAnswerValue {
  value: string | number | (string | number)[];
  text: string;
}

export interface FormAnswer {
  id: string;
  value: FormAnswerValue;
}
