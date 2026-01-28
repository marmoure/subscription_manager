import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "home_title": "License Application",
      "home_description": "Complete the form below to request a license for your machine.",
      "license_request": "License Request",
      "submit_request": "Submit a request for a new machine license.",
      "name": "Name",
      "name_placeholder": "John Doe",
      "shop_name": "Shop Name",
      "shop_name_placeholder": "My Awesome Shop",
      "phone_number": "Phone Number",
      "phone_placeholder": "0654392689",
      "number_of_cashiers": "Number of Cashiers",
      "machine_id": "Machine ID",
      "machine_id_placeholder": "XXXX-XXXX-XXXX-XXXX",
      "machine_id_description": "You can find the Machine ID in the system settings of your device.",
      "security_check": "Security Check",
      "submitting": "Submitting...",
      "submit_button": "Submit Request",
      "error": "Error",
      "check_form_errors": "Please check the form for errors.",
      "unknown_error": "An unknown error occurred.",
      "failed_to_submit": "Failed to submit request. Please try again.",
      "approved": "License Request Approved!",
      "approved_description": "Your license has been successfully generated. Please save this key safely.",
      "expires_on": "Expires on",
      "request_another": "Request Another License",
      "copy_to_clipboard": "Copy to clipboard",
      "validation": {
        "name_min": "Name must be at least 2 characters",
        "name_max": "Name must be less than 100 characters",
        "name_invalid": "Name contains invalid characters (< or >)",
        "machine_id_required": "Machine ID is required",
        "machine_id_max": "Machine ID is too long",
        "machine_id_alphanumeric": "Machine ID must be alphanumeric",
        "phone_invalid": "Invalid phone number format (must be 7-15 digits)",
        "shop_name_min": "Shop name must be at least 2 characters",
        "shop_name_max": "Shop name must be less than 100 characters",
        "shop_name_invalid": "Shop name contains invalid characters (< or >)",
        "cashiers_integer": "Number of cashiers must be an integer",
        "cashiers_min": "Number of cashiers must be at least 1",
        "cashiers_max": "Number of cashiers cannot exceed 50",
        "captcha_required": "Please verify you are not a robot"
      }
    }
  },
  fr: {
    translation: {
      "home_title": "Demande de Licence",
      "home_description": "Remplissez le formulaire ci-dessous pour demander une licence pour votre machine.",
      "license_request": "Demande de Licence",
      "submit_request": "Soumettre une demande pour une nouvelle licence machine.",
      "name": "Nom",
      "name_placeholder": "Jean Dupont",
      "shop_name": "Nom de la Boutique",
      "shop_name_placeholder": "Ma Super Boutique",
      "phone_number": "Numéro de Téléphone",
      "phone_placeholder": "0654392689",
      "number_of_cashiers": "Nombre de Caissiers",
      "machine_id": "ID de la Machine",
      "machine_id_placeholder": "XXXX-XXXX-XXXX-XXXX",
      "machine_id_description": "Vous pouvez trouver l'ID de la machine dans les paramètres système de votre appareil.",
      "security_check": "Contrôle de Sécurité",
      "submitting": "Envoi en cours...",
      "submit_button": "Envoyer la Demande",
      "error": "Erreur",
      "check_form_errors": "Veuillez vérifier les erreurs dans le formulaire.",
      "unknown_error": "Une erreur inconnue est survenue.",
      "failed_to_submit": "Échec de l'envoi de la demande. Veuillez réessayer.",
      "approved": "Demande de Licence Approuvée !",
      "approved_description": "Votre licence a été générée avec succès. Veuillez conserver cette clé précieusement.",
      "expires_on": "Expire le",
      "request_another": "Demander une autre Licence",
      "copy_to_clipboard": "Copier dans le presse-papiers",
      "validation": {
        "name_min": "Le nom doit comporter au moins 2 caractères",
        "name_max": "Le nom doit comporter moins de 100 caractères",
        "name_invalid": "Le nom contient des caractères invalides (< ou >)",
        "machine_id_required": "L'ID de la machine est requis",
        "machine_id_max": "L'ID de la machine est trop long",
        "machine_id_alphanumeric": "L'ID de la machine doit être alphanumérique",
        "phone_invalid": "Format de numéro de téléphone invalide (doit comporter de 7 à 15 chiffres)",
        "shop_name_min": "Le nom de la boutique doit comporter au moins 2 caractères",
        "shop_name_max": "Le nom de la boutique doit comporter moins de 100 caractères",
        "shop_name_invalid": "Le nom de la boutique contient des caractères invalides (< ou >)",
        "cashiers_integer": "Le nombre de caissiers doit être un entier",
        "cashiers_min": "Le nombre de caissiers doit être d'au moins 1",
        "cashiers_max": "Le nombre de caissiers ne peut pas dépasser 50",
        "captcha_required": "Veuillez vérifier que vous n'êtes pas un robot"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
