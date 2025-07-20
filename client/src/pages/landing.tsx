import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Search, Handshake, Star, Github, Twitter, Facebook, Linkedin, Instagram } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <ArrowRight className="text-white text-sm rotate-90" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Skill Swap
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/auth"}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = "/auth"}
                className="gradient-primary text-white border-0 hover:shadow-lg transition-all duration-300"
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Trade Skills. 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Learn Anything.</span>
              <br />Teach Everything.
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join a community-driven platform where knowledge flows freely. Connect with learners and teachers worldwide to exchange skills and grow together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg"
                onClick={() => window.location.href = "/auth"}
                className="gradient-primary text-white border-0 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Get Started Free
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="hover:border-blue-600 transition-colors"
              >
                <Search className="mr-2 h-4 w-4" />
                Browse Skills
              </Button>
            </div>

            {/* Hero Illustration */}
            <div className="relative">
              <div className="w-full max-w-4xl mx-auto h-64 md:h-96 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-700 font-semibold">Community Learning</p>
                  <p className="text-gray-600">Connecting minds worldwide</p>
                </div>
              </div>
              
              {/* Floating Skill Cards */}
              <div className="absolute -top-4 -left-4 glass-card rounded-xl p-4 animate-bounce" style={{ animationDelay: '0s' }}>
                <div className="flex items-center space-x-2">
                  <Github className="text-blue-600 h-5 w-5" />
                  <span className="text-sm font-semibold">Python</span>
                </div>
              </div>
              
              <div className="absolute top-8 -right-8 glass-card rounded-xl p-4 animate-bounce" style={{ animationDelay: '1s' }}>
                <div className="flex items-center space-x-2">
                  <Star className="text-pink-600 h-5 w-5" />
                  <span className="text-sm font-semibold">Design</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 left-1/4 glass-card rounded-xl p-4 animate-bounce" style={{ animationDelay: '2s' }}>
                <div className="flex items-center space-x-2">
                  <Star className="text-emerald-600 h-5 w-5" />
                  <span className="text-sm font-semibold">Music</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Skill Swap Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start exchanging knowledge with our global community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-20 h-20 gradient-primary rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="text-white h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Your Profile</h3>
                <p className="text-gray-600">
                  List the skills you can teach and what you'd like to learn. Add your availability and preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-20 h-20 gradient-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Search className="text-white h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Find Your Match</h3>
                <p className="text-gray-600">
                  Browse through our community and discover people who have the skills you want to learn.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-20 h-20 gradient-accent rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Handshake className="text-white h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Start Swapping</h3>
                <p className="text-gray-600">
                  Send swap requests, connect with your matches, and begin your knowledge exchange journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <ArrowRight className="text-white text-sm rotate-90" />
                </div>
                <h1 className="text-xl font-bold">Skill Swap</h1>
              </div>
              <p className="text-gray-400 mb-6">
                Connecting learners and teachers worldwide through skill exchange.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Twitter className="h-4 w-4" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Facebook className="h-4 w-4" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Linkedin className="h-4 w-4" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Instagram className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Browse Skills</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community Guidelines</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Safety Tips</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Report Issue</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Skill Swap. All rights reserved. Built with ❤️ for the learning community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
