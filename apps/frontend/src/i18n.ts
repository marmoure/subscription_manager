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
  },
  ar: {
    translation: {
      "home_title": "طلب ترخيص",
      "home_description": "أكمل النموذج أدناه لطلب ترخيص لجهازك.",
      "license_request": "طلب ترخيص",
      "submit_request": "تقديم طلب للحصول على ترخيص جهاز جديد.",
      "name": "الاسم",
      "name_placeholder": "فلان الفلاني",
      "shop_name": "اسم المحل",
      "shop_name_placeholder": "محلي الرائع",
      "phone_number": "رقم الهاتف",
      "phone_placeholder": "0654392689",
      "number_of_cashiers": "عدد الكاشير",
      "machine_id": "معرف الجهاز",
      "machine_id_placeholder": "XXXX-XXXX-XXXX-XXXX",
      "machine_id_description": "يمكنك العثور على معرف الجهاز في إعدادات النظام بجهازك.",
      "security_check": "التحقق الأمني",
      "submitting": "جاري الإرسال...",
      "submit_button": "إرسال الطلب",
      "error": "خطأ",
      "check_form_errors": "يرجى التحقق من الأخطاء في النموذج.",
      "unknown_error": "حدث خطأ غير معروف.",
      "failed_to_submit": "فشل إرسال الطلب. يرجى المحاولة مرة أخرى.",
      "approved": "تمت الموافقة على طلب الترخيص!",
      "approved_description": "تم إنشاء ترخيصك بنجاح. يرجى حفظ هذا المفتاح بشكل آمن.",
      "expires_on": "تنتهي الصلاحية في",
      "request_another": "طلب ترخيص آخر",
      "copy_to_clipboard": "نسخ إلى الحافظة",
      "validation": {
        "name_min": "يجب أن يكون الاسم حرفين على الأقل",
        "name_max": "يجب أن يكون الاسم أقل من 100 حرف",
        "name_invalid": "يحتوي الاسم على أحرف غير صالحة (< أو >)",
        "machine_id_required": "معرف الجهاز مطلوب",
        "machine_id_max": "معرف الجهاز طويل جداً",
        "machine_id_alphanumeric": "يجب أن يكون معرف الجهاز أبجدياً رقمياً",
        "phone_invalid": "تنسيق رقم الهاتف غير صالح (يجب أن يكون من 7 إلى 15 رقماً)",
        "shop_name_min": "يجب أن يكون اسم المحل حرفين على الأقل",
        "shop_name_max": "يجب أن يكون اسم المحل أقل من 100 حرف",
        "shop_name_invalid": "يحتوي اسم المحل على أحرف غير صالحة (< أو >)",
        "cashiers_integer": "يجب أن يكون عدد الكاشير عدداً صحيحاً",
        "cashiers_min": "يجب أن يكون عدد الكاشير 1 على الأقل",
        "cashiers_max": "لا يمكن أن يتجاوز عدد الكاشير 50",
        "captcha_required": "يرجى التحقق من أنك لست روبوتاً"
      }
    }
  },
  es: {
    translation: {
      "home_title": "Solicitud de Licencia",
      "home_description": "Complete el formulario a continuación para solicitar una licencia para su máquina.",
      "license_request": "Solicitud de Licencia",
      "submit_request": "Envíe una solicitud para una nueva licencia de máquina.",
      "name": "Nombre",
      "name_placeholder": "Juan Pérez",
      "shop_name": "Nombre de la Tienda",
      "shop_name_placeholder": "Mi Tienda Increíble",
      "phone_number": "Número de Teléfono",
      "phone_placeholder": "0654392689",
      "number_of_cashiers": "Número de Cajeros",
      "machine_id": "ID de la Máquina",
      "machine_id_placeholder": "XXXX-XXXX-XXXX-XXXX",
      "machine_id_description": "Puede encontrar el ID de la máquina en la configuración del sistema de su dispositivo.",
      "security_check": "Control de Seguridad",
      "submitting": "Enviando...",
      "submit_button": "Enviar Solicitud",
      "error": "Error",
      "check_form_errors": "Por favor, compruebe los errores en el formulario.",
      "unknown_error": "Ocurrió un error desconocido.",
      "failed_to_submit": "Error al enviar la solicitud. Inténtelo de nuevo.",
      "approved": "¡Solicitud de Licencia Aprobada!",
      "approved_description": "Su licencia se ha generado correctamente. Guarde esta clave de forma segura.",
      "expires_on": "Expira el",
      "request_another": "Solicitar otra Licencia",
      "copy_to_clipboard": "Copiar al portapapeles",
      "validation": {
        "name_min": "El nombre debe tener al menos 2 caracteres",
        "name_max": "El nombre debe tener menos de 100 caracteres",
        "name_invalid": "El nombre contiene caracteres no válidos (< o >)",
        "machine_id_required": "El ID de la máquina es obligatorio",
        "machine_id_max": "El ID de la máquina es demasiado largo",
        "machine_id_alphanumeric": "El ID de la máquina debe ser alfanumérico",
        "phone_invalid": "Formato de número de teléfono no válido (debe tener entre 7 y 15 dígitos)",
        "shop_name_min": "El nombre de la tienda debe tener al menos 2 caracteres",
        "shop_name_max": "El nombre de la tienda debe tener menos de 100 caracteres",
        "shop_name_invalid": "El nombre de la tienda contiene caracteres no válidos (< o >)",
        "cashiers_integer": "El número de cajeros debe ser un número entero",
        "cashiers_min": "El número de cajeros debe ser al menos 1",
        "cashiers_max": "El número de cajeros no puede exceder de 50",
        "captcha_required": "Por favor, verifique que no es un robot"
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
