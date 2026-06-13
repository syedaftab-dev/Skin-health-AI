RECOMMENDATIONS = {
    "actinic keratosis": {
        "description": "A rough, scaly patch caused by years of sun exposure. It is pre-cancerous and should be monitored.",
        "actions": [
            "Consult a dermatologist for treatment options (cryotherapy, topical creams)",
            "Apply SPF 50+ mineral sunscreen daily",
            "Avoid tanning beds and prolonged sun exposure",
            "Wear protective clothing and wide-brim hats outdoors",
        ],
        "products": ["SPF 50+ mineral sunscreen", "Gentle non-comedogenic moisturizer"],
        "consult_doctor": True,
    },
    "basal cell carcinoma": {
        "description": "The most common form of skin cancer. Highly treatable when detected early.",
        "actions": [
            "Seek dermatologist consultation immediately",
            "Do not scratch or irritate the lesion",
            "Avoid direct sun exposure on the affected area",
            "Discuss surgical or non-surgical treatment options with your doctor",
        ],
        "products": [],
        "consult_doctor": True,
    },
    "dermatofibroma": {
        "description": "A common benign skin growth, usually harmless and painless.",
        "actions": [
            "No treatment is usually necessary",
            "Monitor for rapid growth or changes in appearance",
            "Consult a doctor if it becomes painful or bleeds",
        ],
        "products": ["Gentle daily moisturizer"],
        "consult_doctor": False,
    },
    "melanoma": {
        "description": "A serious and aggressive form of skin cancer. Immediate medical attention is critical.",
        "actions": [
            "Consult a dermatologist or oncologist immediately",
            "Do not attempt self-treatment of any kind",
            "Avoid all UV exposure — sunlight and tanning beds",
            "Schedule a professional biopsy without delay",
        ],
        "products": [],
        "consult_doctor": True,
    },
    "nevus": {
        "description": "A common mole (melanocytic nevus). Usually benign but should be monitored for changes.",
        "actions": [
            "Perform monthly self-skin checks using the ABCDE rule",
            "Apply broad-spectrum SPF 50+ sunscreen daily",
            "See a dermatologist if the mole changes in size, shape, or color",
        ],
        "products": ["Broad-spectrum SPF 50+ sunscreen", "Gentle moisturizer"],
        "consult_doctor": False,
    },
    "pigmented benign keratosis": {
        "description": "A non-cancerous skin growth with pigmentation. Common with aging.",
        "actions": [
            "No treatment is required unless cosmetically bothersome",
            "Keep the area moisturized",
            "Avoid picking or scratching the growth",
            "Consult a doctor if it changes rapidly",
        ],
        "products": ["Urea-based moisturizer", "Gentle exfoliating toner"],
        "consult_doctor": False,
    },
    "seborrheic keratosis": {
        "description": "A common non-cancerous skin growth that appears waxy or wart-like.",
        "actions": [
            "No treatment is needed unless it causes irritation",
            "Avoid scratching or picking at the growth",
            "See a dermatologist if appearance changes suddenly",
        ],
        "products": ["Salicylic acid lotion (2%)", "Gentle moisturizer"],
        "consult_doctor": False,
    },
    "squamous cell carcinoma": {
        "description": "The second most common form of skin cancer. Requires prompt medical treatment.",
        "actions": [
            "Consult a dermatologist immediately",
            "Do not self-medicate or delay treatment",
            "Protect the area from sun exposure",
            "Discuss excision or radiation options with your doctor",
        ],
        "products": [],
        "consult_doctor": True,
    },
    "vascular lesion": {
        "description": "A skin lesion involving blood vessels. Ranges from benign to requiring treatment.",
        "actions": [
            "Consult a dermatologist for proper assessment",
            "Avoid trauma or pressure on the affected area",
            "Apply SPF 30+ sunscreen to protect the lesion",
        ],
        "products": ["SPF 30+ sunscreen", "Gentle soothing moisturizer"],
        "consult_doctor": True,
    },
}

GENERAL_SKINCARE = {
    "daily": [
        "Cleanse face twice daily with a gentle cleanser",
        "Apply SPF 30+ sunscreen every morning",
        "Moisturize after cleansing",
        "Stay hydrated — drink 8 glasses of water daily",
        "Avoid touching face with unwashed hands",
    ],
    "weekly": [
        "Exfoliate 1-2 times per week",
        "Use a hydrating face mask",
        "Check skin for new or changing spots",
    ],
    "lifestyle": [
        "Get 7-9 hours of sleep per night",
        "Eat a diet rich in antioxidants",
        "Reduce stress through exercise or meditation",
        "Avoid smoking and limit alcohol consumption",
    ],
}


def get_recommendation(predicted_class, confidence, severity):
    rec = RECOMMENDATIONS.get(predicted_class, {
        "description": "Condition could not be clearly identified.",
        "actions": ["Consult a dermatologist for professional diagnosis."],
        "products": [],
        "consult_doctor": True,
    }).copy()

    if confidence < 60:
        rec["note"] = "Confidence is low. Please upload a clearer, well-lit image or consult a doctor."

    if severity == "High":
        rec["urgency"] = "URGENT: Please seek medical attention as soon as possible."
    elif severity == "Medium":
        rec["urgency"] = "Recommended: Schedule a dermatologist appointment soon."
    else:
        rec["urgency"] = "Low risk. Monitor regularly and follow general skincare advice."

    rec["general_skincare"] = GENERAL_SKINCARE
    return rec


def format_recommendation(result):
    pred_class = result["predicted_class"]
    confidence = result["confidence"]
    severity = result["severity"]

    rec = get_recommendation(pred_class, confidence, severity)

    output = {
        "diagnosis": result["class_name"],
        "confidence_percent": confidence,
        "severity": severity,
        "description": rec["description"],
        "urgency": rec.get("urgency", ""),
        "recommended_actions": rec["actions"],
        "suggested_products": rec.get("products", []),
        "general_skincare": rec["general_skincare"],
        "consult_doctor": rec["consult_doctor"],
        "disclaimer": (
            "This analysis is for informational purposes only and does not constitute "
            "medical advice. Always consult a qualified dermatologist for diagnosis and treatment."
        ),
    }

    if "note" in rec:
        output["note"] = rec["note"]

    return output
