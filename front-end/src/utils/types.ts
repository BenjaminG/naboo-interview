// Type for geo.api.gouv.fr /communes API response
export interface City {
  nom: string;
  code: string;
  departement: {
    code: string;
    nom: string;
  };
}
