let userModel = require('../schemas/users')
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const mailHandler = require('../utils/mailHandler');
const roleModel = require('../schemas/roles');

module.exports = {
    CreateAnUser: async function (username, password, email, role, session,
        fullName, avatarUrl, status, loginCount) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save({ session });
        return newItem;
    },
    GetAnUserByUsername: async function (username) {
        return await userModel.findOne({
            isDeleted: false,
            username: username
        })
    }, GetAnUserById: async function (id) {
        return await userModel.findOne({
            isDeleted: false,
            _id: id
        }).populate('role')
    }, GetAnUserByEmail: async function (email) {
        return await userModel.findOne({
            isDeleted: false,
            email: email
        })
    }, GetAnUserByToken: async function (token) {
        let user = await userModel.findOne({
            isDeleted: false,
            forgotPasswordToken: token
        })
        if (user && user.forgotPasswordTokenExp > Date.now()) {
            return user;
        }
        return false;
    },
    ImportUsersFromExcel: async function (filePath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const sheet = workbook.getWorksheet(1);
        
        let userRole = await roleModel.findOne({ name: 'USER' });
        if (!userRole) {
            userRole = await roleModel.findOne({ name: 'user' });
        }
        if (!userRole) throw new Error("Role 'USER' not found in database. Please ensure the role exists.");

        const results = [];
        for (let i = 2; i <= sheet.rowCount; i++) {
            const row = sheet.getRow(i);
            const username = row.getCell(1).value; // Column A
            let emailValue = row.getCell(2).value; // Column B
            let email = "";

            if (emailValue) {
                if (typeof emailValue === 'string') {
                    email = emailValue;
                } else if (typeof emailValue === 'object') {
                    email = emailValue.text || emailValue.result || "";
                }
            }

            if (!username || !email) continue;
            
            const cleanUsername = String(username).trim();
            const cleanEmail = String(email).trim();

            // Generate 16 char random password
            const password = crypto.randomBytes(8).toString('hex');
            
            try {
                // Duplicate check
                const existing = await userModel.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] });
                if (existing) {
                    results.push({ username: cleanUsername, email: cleanEmail, status: 'Error', message: 'User or email already exists' });
                    continue;
                }

                const newUser = await module.exports.CreateAnUser(
                    cleanUsername, password, cleanEmail, userRole._id, null, 
                    cleanUsername, undefined, true, 0
                );
                
                // Attempt to send email, catch errors but continue import
                try {
                    await mailHandler.sendUserCredentials(cleanEmail, cleanUsername, password);
                } catch (mailErr) {
                    console.error(`Email sending failed for ${cleanUsername}: ${mailErr.message}`);
                    // Still mark as success for account creation, but note email failure
                    results.push({ username: cleanUsername, email: cleanEmail, password, status: 'Success (Email Failed)', error: mailErr.message });
                    continue;
                }
                
                results.push({ username: cleanUsername, email: cleanEmail, password, status: 'Success' });
            } catch (err) {
                results.push({ username: cleanUsername, email: cleanEmail, status: 'Error', message: err.message });
            }
        }
        return results;
    }
}