import { Link } from 'react-router-dom';
import { Users, Briefcase, Star, ArrowRight, Zap, Shield, TrendingUp, Search, Calendar, MessageSquare, Award } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Landing() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const y3 = useTransform(scrollY, [0, 500], [0, 100]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 overflow-hidden">
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              style={{ y: y1 }}
              className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            />
            <motion.div
              style={{ y: y2 }}
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            />
            <motion.div
              style={{ y: y3 }}
              className="absolute top-40 left-1/2 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative max-w-7xl mx-auto text-center"
          >
            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6">
              Exchange Skills,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
                Build Connections
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-neutral-600 mb-12 max-w-3xl mx-auto">
              Join the ultimate platform where professionals collaborate, share expertise, and grow together
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-600 to-secondary-500 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-2xl flex items-center justify-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>
              <Link
                to="/marketplace"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-neutral-900 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-neutral-200 hover:border-primary-600 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Explore Skills</span>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
            >
              {[
                { icon: Users, title: "Connect & Collaborate", desc: "Find professionals with complementary skills and start meaningful collaborations", color: "from-primary-500 to-secondary-400" },
                { icon: Briefcase, title: "Showcase Your Work", desc: "Build a stunning portfolio that highlights your expertise and achievements", color: "from-secondary-500 to-primary-400" },
                { icon: Star, title: "Discover Talent", desc: "Browse through a marketplace of skilled professionals ready to collaborate", color: "from-primary-600 to-secondary-500" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-neutral-600">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-50 to-white">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                Get started in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary-200 via-secondary-300 to-primary-200"></div>

              {[
                { step: "01", icon: Users, title: "Create Your Profile", desc: "Sign up and showcase your skills, expertise level, and what you're looking to learn.", color: "from-primary-600 to-primary-400" },
                { step: "02", icon: Search, title: "Find Your Match", desc: "Browse the marketplace to find professionals with complementary skills and interests.", color: "from-secondary-600 to-secondary-400" },
                { step: "03", icon: Calendar, title: "Start Swapping", desc: "Schedule sessions, collaborate in real-time, and grow your professional network.", color: "from-primary-500 to-secondary-500" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className="relative text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg relative z-10`}>
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-5xl font-black text-neutral-100 absolute -top-4 left-1/2 -translate-x-1/2 select-none">{item.step}</span>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                    <p className="text-neutral-600 max-w-xs mx-auto">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Why Choose Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Why Choose HSEC?
              </h2>
              <p className="text-xl text-neutral-600">
                Everything you need to grow your professional network
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Fast Matching", desc: "Our intelligent algorithm connects you with the right people instantly", color: "text-primary-600", bg: "from-primary-100 to-secondary-100" },
                { icon: Shield, title: "Secure Platform", desc: "Your data and privacy are protected with enterprise-grade security", color: "text-secondary-600", bg: "from-secondary-100 to-primary-100" },
                { icon: TrendingUp, title: "Grow Together", desc: "Track your progress and achievements as you collaborate and learn", color: "text-primary-600", bg: "from-primary-100 to-secondary-100" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Stats / Social Proof Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-neutral-50">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "5,000+", label: "Professionals", icon: Users },
                { value: "10,000+", label: "Skills Swapped", icon: Award },
                { value: "500+", label: "Active Sessions", icon: MessageSquare },
                { value: "98%", label: "Satisfaction Rate", icon: Star },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="p-6"
                >
                  <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-black text-neutral-900 mb-1">{stat.value}</div>
                  <div className="text-neutral-500 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                What Our Users Say
              </h2>
              <p className="text-xl text-neutral-600">
                Hear from professionals who've grown through HSEC
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Frontend Developer",
                  quote: "HSEC helped me learn Python by swapping my React expertise. The platform made it incredibly easy to find the right match!",
                  initials: "SJ",
                  gradient: "from-primary-600 to-secondary-500"
                },
                {
                  name: "Ahmed Khan",
                  role: "Data Scientist",
                  quote: "I improved my UI/UX design skills while teaching machine learning concepts. The scheduling feature is fantastic!",
                  initials: "AK",
                  gradient: "from-secondary-600 to-primary-500"
                },
                {
                  name: "Maria Garcia",
                  role: "Product Manager",
                  quote: "The career booster module helped me build a professional resume, and I connected with amazing developers for skill exchanges.",
                  initials: "MG",
                  gradient: "from-primary-500 to-secondary-400"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-warning-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-neutral-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                      <div className="text-sm text-neutral-500">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-secondary-500">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of professionals already collaborating on HSEC
            </p>
            <Link
              to="/signup"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold shadow-xl"
              >
                <span>Create Your Account</span>
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
