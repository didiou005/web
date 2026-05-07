// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const poolPromise = require('../db/pool');
const logsController = require('./logsController');

/**
 * Connexion d'un administrateur
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const pool = await poolPromise;

  try {
    // 1. Rechercher l'utilisateur
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const user = result.rows[0];

    // 2. Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // 3. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // 4. Mettre à jour la dernière connexion
    await pool.query(
      'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // 5. Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'nadhif_secret_key_2026',
      { expiresIn: '24h' }
    );

    // 6. Logger l'audit de connexion (Nouveau système)
    await logsController.logAction(user.id, 'LOGIN', 'ADMIN', user.id, 'Connexion réussie', null, req);

    // Legacy support (optionnel, peut être retiré si useless)
    await pool.query(
      'INSERT INTO login_audit (admin_id, email, ip_address, user_agent, success) VALUES ($1, $2, $3, $4, $5)',
      [user.id, email, req.ip, req.get('user-agent'), true]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Erreur Login:', error);
    
    // Logger l'échec de connexion si l'email était fourni
    if (email) {
      try {
        await pool.query(
          'INSERT INTO login_audit (email, ip_address, user_agent, success) VALUES ($1, $2, $3, $4)',
          [email, req.ip, req.get('user-agent'), false]
        );
      } catch (e) {}
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

/**
 * Créer un nouvel administrateur (Réservé au Super Admin)
 */
exports.createAdmin = async (req, res) => {
  const { email, password, full_name, role, function: userFunction } = req.body;
  const pool = await poolPromise;

  try {
    // Seul un super_admin peut créer un compte
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Action réservée au Super Administrateur'
      });
    }

    // Vérifier si l'email existe déjà
    const checkEmail = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insérer l'utilisateur
    const result = await pool.query(
      `INSERT INTO admin_users (email, full_name, password_hash, role, function)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role`,
      [email, full_name, password_hash, role || 'admin', userFunction]
    );

    const newUser = result.rows[0];
    
    // Log creation
    await logsController.logAction(req.user.id, 'CREATE', 'ADMIN', newUser.id, `Création de l'administrateur ${newUser.email}`, newUser, req);

    res.status(201).json({
      success: true,
      data: newUser
    });

  } catch (error) {
    console.error('Erreur CreateAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
};

/**
 * Obtenir les infos de l'utilisateur actuel
 */
exports.getMe = async (req, res) => {
  const pool = await poolPromise;
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, function FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Lister tous les administrateurs (Réservé au Super Admin)
 */
exports.getAllAdmins = async (req, res) => {
  const pool = await poolPromise;
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé' });
    }

    const result = await pool.query(
      'SELECT id, email, full_name, role, function, is_active, created_at, last_login_at FROM admin_users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des admins' });
  }
};

/**
 * Modifier un compte (Réservé au Super Admin)
 */
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, full_name, role, function: userFunction, password } = req.body;
  const pool = await poolPromise;

  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé' });
    }

    // Vérifier si l'admin existe
    const adminCheck = await pool.query('SELECT id FROM admin_users WHERE id = $1', [id]);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Administrateur introuvable' });
    }

    // Si l'email est modifié, vérifier s'il est déjà pris
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM admin_users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
      }
    }

    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (full_name) {
      updateFields.push(`full_name = $${paramIndex++}`);
      params.push(full_name);
    }
    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (role) {
      updateFields.push(`role = $${paramIndex++}`);
      params.push(role);
    }
    if (userFunction !== undefined) {
      updateFields.push(`function = $${paramIndex++}`);
      params.push(userFunction);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      updateFields.push(`password_hash = $${paramIndex++}`);
      params.push(password_hash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun champ à modifier' });
    }

    params.push(id);
    const query = `UPDATE admin_users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, full_name, role, function`;
    
    const result = await pool.query(query, params);

    // Log update
    await logsController.logAction(req.user.id, 'UPDATE', 'ADMIN', id, `Mise à jour de l'administrateur ${result.rows[0].email}`, { changedFields: updateFields }, req);

    res.json({
      success: true,
      message: 'Compte mis à jour avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur UpdateAdmin:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
};

/**
 * Supprimer un administrateur (Réservé au Super Admin)
 */
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;
  const client = await pool.connect();

  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous supprimer vous-même' });
    }

    await client.query('BEGIN');

    // 1. Supprimer d'abord les logs d'audit (contrainte de clé étrangère)
    await client.query('DELETE FROM login_audit WHERE admin_id = $1', [id]);

    // 2. Supprimer l'administrateur
    const result = await client.query('DELETE FROM admin_users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Administrateur introuvable' });
    }

    await client.query('COMMIT');
    
    // Log deletion (en dehors de la transaction DB pour ne pas bloquer si erreur log)
    await logsController.logAction(req.user.id, 'DELETE', 'ADMIN', id, 'Suppression administrateur', null, req);

    res.json({ success: true, message: 'Administrateur supprimé avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur DeleteAdmin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression',
      detail: error.message 
    });
  } finally {
    client.release();
  }
};
/**
 * Mettre à jour son propre profil (Tout utilisateur authentifié)
 */
exports.updateProfile = async (req, res) => {
  const { full_name, function: userFunction } = req.body;
  const pool = await poolPromise;

  try {
    const result = await pool.query(
      `UPDATE admin_users 
       SET full_name = $1, function = $2 
       WHERE id = $3 
       RETURNING id, email, full_name, role, function`,
      [full_name, userFunction, req.user.id]
    );

    // Log profile update
    await logsController.logAction(req.user.id, 'UPDATE', 'ADMIN', req.user.id, 'Mise à jour du profil', null, req);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur UpdateProfile:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du profil' });
  }
};

/**
 * Changer son propre mot de passe
 */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const pool = await poolPromise;

  try {
    // 1. Récupérer le hash actuel
    const result = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    // 2. Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'L\'ancien mot de passe est incorrect' });
    }

    // 3. Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // 4. Mettre à jour
    await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);

    // Log password change
    await logsController.logAction(req.user.id, 'UPDATE', 'ADMIN', req.user.id, 'Changement de mot de passe', null, req);

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur ChangePassword:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du changement de mot de passe' });
  }
};
