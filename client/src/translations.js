export const translations = {
  fr: {
    nav: {
      home: "Accueil",
      report: "Signaler",
      follow_up: "Suivi",
      login: "Connexion"
    },
    hero: {
      title_1: "Ensemble pour une",
      title_highlight: "Wilaya plus propre",
      subtitle: "Plateforme officielle de signalement et de gestion des déchets de la Wilaya de Bouira. Signalez, suivez et participez à l'amélioration de notre environnement.",
      btn_report: "Signaler un problème",
      btn_how: "Comment ça marche ?"
    },
    cards: {
      geo: { title: "Géolocalisation", text: "Précise et rapide" },
      photo: { title: "Preuves Photos", text: "Suivi en temps réel" }
    },
    stats: {
      communes: "Communes Couvertes",
      service: "Service Actif",
      resolved: "Problèmes Résolus"
    },
    features: {
      title: "Comment ça fonctionne ?",
      subtitle: "Une démarche simple en 3 étapes pour un citoyen engagé",
      step1: { title: "Localisez", text: "Utilisez la carte interactive pour indiquer l'emplacement précis du dépôt sauvage ou du problème." },
      step2: { title: "Photographiez", text: "Ajoutez jusqu'à 5 photos pour permettre aux équipes techniques d'évaluer la situation." },
      step3: { title: "Suivez", text: "Recevez un code unique pour suivre l'avancement de votre signalement en temps réel." }
    },
    form: {
      title: "Nouvelle Plainte",
      subtitle: "Signalez un problème de collecte ou une décharge sauvage.",
      mandatory_legend: "* Champs obligatoires",
      step1: { title: "Localisation", commune: "Commune", select_commune: "Sélectionnez votre commune", address: "Adresse (Optionnel)", address_ph: "Quartier, rue...", gps: "Position GPS", gps_instruction: "(Veuillez indiquer la position de la plainte, et non votre position actuelle)", locate_btn: "Ma position actuelle", complaint_pos: "localisation du signalement", locating: "Recherche...", not_supported: "Non supportée", gps_error: "Erreur GPS" },
      step2: { 
        title: "Détails du problème", 
        waste_type: "Type de déchets", 
        household: "Déchets Ménagers", 
        inert: "Déchets Inertes", 
        complaint_type: "Type de plainte", 
        select_type: "Sélectionnez un type", 
        comment: "Commentaire (Optionnel)", 
        comment_ph: "Décrivez la situation...",
        types: {
            absence_bac: "Absence de bac",
            surplus_poubelles: "Surplus de poubelles",
            negligence: "Négligence de collecte",
            decharge_sauvage: "Décharge sauvage"
        }
      },
      step3: { title: "Photos", label: "Preuves photo (Max 5) (Optionnel)", drop: "Cliquez ou glissez vos photos ici" },
      btn_submit: "Envoyer la plainte",
      sending: "Envoi...",
      success_title: "Signalement Envoyé !",
      success_msg: "Votre signalement a été enregistré avec succès.",
      success_hint: "Veuillez noter ce code pour suivre l'état de votre plainte.",
      copy: "Copier",
      copied: "Copié !",
      btn_follow: "Suivre ma plainte",
      btn_reset: "Réinitialiser",
      reset_confirm: "Êtes-vous sûr de vouloir effacer tout le formulaire ?"
    },
    follow_up: {
      title: "Suivi de votre plainte",
      placeholder: "Rechercher par code (ex: TSK-20260203-4114)...",
      btn_search: "Rechercher",
      searching: "Recherche...",
      error_empty: "Veuillez saisir un code de plainte",
      not_found_title: "Aucune plainte trouvée",
      not_found_text: "Le code {code} ne correspond à aucune plainte.",
      table: {
        header_id: "PLAINTE / DATE",
        header_type: "TYPE",
        header_loc: "LOCALISATION",
        header_msg: "MESSAGE",
        header_status: "ÉTAT"
      },
      modal: {
        title: "Détails du Signalement",
        loc: "Localisation",
        type: "Type",
        msg: "Message",
        photos: "Photos du constat",
        no_photos: "Aucun élément visuel",
        no_description: "Pas de description",
        last_update: "Dernière mise à jour :",
        history_title: "Historique des recherches",
        clear_history: "Effacer l'historique",
        confirm_clear_title: "Confirmer la suppression",
        confirm_clear_msg: "Êtes-vous sûr de vouloir effacer tout l'historique ?",
        yes: "Oui, effacer",
        no: "Annuler",
        no_history: "Aucune recherche récente"
      },
      status: {
        en_cours: "EN COURS",
        en_attente: "EN ATTENTE",
        resolue: "RÉSOLUE",
        annulee: "ANNULÉE"
      }
    }
  },
  ar: {
    nav: {
      home: "الرئيسية",
      report: "تبليغ",
      follow_up: "متابعة",
      login: "دخول"
    },
    hero: {
      title_1: "معاً من أجل",
      title_highlight: "ولاية أنظف",
      subtitle: "المنصة الرسمية للتبليغ وإدارة النفايات لولاية البويرة. بلغ، تابع وشارك في تحسين بيئتنا.",
      btn_report: "بلغ عن مشكلة",
      btn_how: "كيف يعمل؟"
    },
    cards: {
      geo: { title: "تحديد الموقع", text: "دقيق وسريع" },
      photo: { title: "إثبات بالصور", text: "متابعة فورية" }
    },
    stats: {
      communes: "بلدية مغطاة",
      service: "خدمة نشطة",
      resolved: "مشكلة محلولة"
    },
    features: {
      title: "كيف يعمل النظام؟",
      subtitle: "خطوات بسيطة لمواطن فعال",
      step1: { title: "حدد الموقع", text: "استخدم الخريطة التفاعلية لتحديد مكان المكب العشوائي أو المشكلة بدقة." },
      step2: { title: "صور", text: "أضف ما يصل إلى 5 صور للسماح للفرق التقنية بتقييم الوضع." },
      step3: { title: "تابع", text: "احصل على رمز تتبع فريد لمتابعة تقدم تبليغك في الوقت الفعلي." }
    },
    form: {
      title: "تبليغ جديد",
      subtitle: "بلغ عن مشكلة في الجمع أو مكب عشوائي.",
      mandatory_legend: "* حقول إجبارية",
      step1: { title: "الموقع", commune: "البلدية", select_commune: "اختر البلدية", address: "العنوان (اختياري)", address_ph: "الحي، الشارع...", gps: "إحداثيات GPS", gps_instruction: "(يرجى تحديد موقع التبليغ، وليس موقعك الحالي)", locate_btn: "موقعي الحالي", complaint_pos: "موقع التبليغ", locating: "جاري البحث...", not_supported: "غير مدعوم", gps_error: "خطأ GPS" },
      step2: { 
        title: "تفاصيل المشكلة", 
        waste_type: "نوع النفايات", 
        household: "نفايات منزلية", 
        inert: "نفايات صلبة/ردم", 
        complaint_type: "نوع التبليغ", 
        select_type: "اختر النوع", 
        comment: "تعليق (اختياري)", 
        comment_ph: "وصف الحالة...",
        types: {
            absence_bac: "غياب الحاويات",
            surplus_poubelles: "تراكم القمامة",
            negligence: "إهمال الجمع",
            decharge_sauvage: "مكب عشوائي"
        }
      },
      step3: { title: "الصور", label: "صور إثبات (الحد الأقصى 5) (اختياري)", drop: "انقر أو اسحب الصور هنا" },
      btn_submit: "إرسال التبليغ",
      sending: "جاري الإرسال...",
      success_title: "تم إرسال التبليغ!",
      success_msg: "تم تسجيل تبليغك بنجاح.",
      success_hint: "يرجى الاحتفاظ بهذا الرمز لمتابعة حالة تبليغك.",
      copy: "نسخ",
      copied: "تم النسخ!",
      btn_follow: "متابعة بلاغي",
      btn_reset: "إعادة ضبط",
      reset_confirm: "هل أنت متأكد من رغبتك في مسح كل البيانات؟"
    },
    follow_up: {
      title: "متابعة بلاغك",
      placeholder: "ابحث عن طريق الرمز (مثال: TSK-20260203-4114)...",
      btn_search: "بحث",
      searching: "جاري البحث...",
      error_empty: "يرجى إدخال رمز البلاغ",
      not_found_title: "لم يتم العثور على أي بلاغ",
      not_found_text: "الرمز {code} لا يطابق أي بلاغ في نظامنا.",
      table: {
        header_id: "البلاغ / التاريخ",
        header_type: "النوع",
        header_loc: "الموقع",
        header_msg: "الرسالة",
        header_status: "الحالة"
      },
      modal: {
        title: "تفاصيل التبليغ",
        loc: "الموقع",
        type: "النوع",
        msg: "الرسالة",
        photos: "صور المعاينة",
        no_photos: "لا توجد صور",
        no_description: "لا يوجد وصف",

        last_update: "آخر تحديث :",
        history_title: "سجل البحث",
        clear_history: "مسح السجل",
        confirm_clear_title: "تأكيد المسح",
        confirm_clear_msg: "هل أنت متأكد من رغبتك في مسح كل سجل البحث؟",
        yes: "نعم، مسح",
        no: "إلغاء",
        no_history: "لا توجد عمليات بحث حديثة"
      },
      status: {
        en_cours: "قيد المعالجة",
        en_attente: "في الانتظار",
        resolue: "تم الحل",
        annulee: "ملغاة"
      }
    }
  }
};
