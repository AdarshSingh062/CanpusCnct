import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    department: user.department || '',
    semester: user.semester || '',
    rollNumber: user.rollNumber || '',
    skills: (user.skills || []).join(', '),
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await authApi.updateProfile({
        ...form,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });

      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // Animation settings
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="mx-auto max-w-xl space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      {/* Profile Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-4"
      >
        {/* Avatar animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: 'backOut',
          }}
          whileHover={{
            scale: 1.06,
          }}
        >
          <Avatar user={user} size={64} />
        </motion.div>

        {/* User information */}
        <motion.div variants={itemVariants}>
          <motion.h1
            className="font-display text-xl font-semibold"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {user.name}
          </motion.h1>

          <motion.p
            className="text-sm text-gray-500 capitalize"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {user.role} · {user.email}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        variants={itemVariants}
        whileHover={{
          y: -2,
          transition: { duration: 0.2 },
        }}
      >
        <Card>
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >

            {/* Name */}
            <motion.div variants={itemVariants}>
              <Input
                label="Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </motion.div>

            {/* Bio */}
            <motion.div variants={itemVariants}>
              <Input
                label="Bio"
                textarea
                value={form.bio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bio: e.target.value,
                  })
                }
              />
            </motion.div>

            {/* Department + Semester */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3"
            >
              <Input
                label="Department"
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                  })
                }
              />

              <Input
                label="Semester"
                type="number"
                min={1}
                max={12}
                value={form.semester}
                onChange={(e) =>
                  setForm({
                    ...form,
                    semester: e.target.value,
                  })
                }
              />
            </motion.div>

            {/* Roll Number */}
            <motion.div variants={itemVariants}>
              <Input
                label="Roll Number"
                value={form.rollNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rollNumber: e.target.value,
                  })
                }
              />
            </motion.div>

            {/* Skills */}
            <motion.div variants={itemVariants}>
              <Input
                label="Skills (comma-separated)"
                value={form.skills}
                onChange={(e) =>
                  setForm({
                    ...form,
                    skills: e.target.value,
                  })
                }
              />
            </motion.div>

            {/* Save Button */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                type="submit"
                loading={saving}
              >
                Save Changes
              </Button>
            </motion.div>

          </motion.form>
        </Card>
      </motion.div>
    </motion.div>
  );
}