const mongoose = require('mongoose');
const userModel = require('./schemas/users');
const roleModel = require('./schemas/roles');

async function clear() {
    try {
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-C4');
        console.log("Connected to MongoDB");

        const adminRole = await roleModel.findOne({ name: 'ADMIN' });
        const result = await userModel.deleteMany({ role: { $ne: adminRole ? adminRole._id : null } });
        console.log(`Deleted ${result.deletedCount} non-admin users`);

    } catch (err) {
        console.error("Clear failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

clear();
