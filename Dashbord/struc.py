import os

# Définition de la structure du projet
structure = {
    "nadhif-backend": {
        "src": {
            "controllers": ["dashboardController.js", "statsController.js"],
            "services": ["statsService.js", "queryBuilder.js"],
            "models": ["Complaint.js", "Region.js", "Team.js"],
            "middleware": ["auth.js", "validate.js"],
            "routes": ["dashboard.js", "stats.js"],
            "db": {
                "files": ["pool.js"],
                "folders": ["migrations"]
            },
            "utils": ["validators.js"]
        }
    }
}

def create_structure(base_path, structure_dict):
    for name, content in structure_dict.items():
        path = os.path.join(base_path, name)
        os.makedirs(path, exist_ok=True)

        if isinstance(content, dict):
            # gestion spéciale pour db (fichiers + dossiers)
            if "files" in content or "folders" in content:
                for file in content.get("files", []):
                    file_path = os.path.join(path, file)
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write("")
                for folder in content.get("folders", []):
                    os.makedirs(os.path.join(path, folder), exist_ok=True)
            else:
                create_structure(path, content)

        elif isinstance(content, list):
            for file in content:
                file_path = os.path.join(path, file)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write("")

# Création de la structure
create_structure(".", structure)

print("✅ Structure du projet 'nadhif-backend' créée avec succès !")