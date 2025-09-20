const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">CoastalEye</h3>
            <p className="text-muted-foreground">
              Advanced coastal hazard monitoring for safer communities.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-smooth">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Privacy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Emergency</h4>
            <p className="text-muted-foreground text-sm">
              In case of immediate danger, contact local emergency services first.
            </p>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 CoastalEye. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;