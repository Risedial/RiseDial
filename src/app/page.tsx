export default function Home() {
  return (
    <main style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '6rem' 
    }}>
      <div style={{ 
        zIndex: 10, 
        maxWidth: '80rem', 
        width: '100%', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        fontFamily: 'monospace', 
        fontSize: '0.875rem', 
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', textAlign: 'center' }}>
          Welcome to Risedial
        </h1>
        <p style={{ fontSize: '1.25rem', textAlign: 'center', marginTop: '1rem' }}>
          AI Therapeutic Companion for Personal Growth
        </p>
      </div>

      <div style={{ 
        position: 'relative', 
        display: 'flex', 
        placeItems: 'center',
        textAlign: 'center'
      }}>
        <div>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Your Journey Begins Here
          </h2>
          <p style={{ 
            margin: 0, 
            maxWidth: '30ch', 
            fontSize: '0.875rem', 
            opacity: 0.5, 
            textAlign: 'center' 
          }}>
            Connect with your AI therapeutic companion for personalized growth and wellness support.
          </p>
        </div>
      </div>

      <div style={{ 
        marginBottom: '8rem', 
        display: 'grid', 
        textAlign: 'center', 
        maxWidth: '80rem', 
        width: '100%', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        <div style={{ 
          borderRadius: '0.5rem', 
          border: '1px solid transparent', 
          padding: '1.25rem', 
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Chat Support
          </h3>
          <p style={{ margin: 0, maxWidth: '30ch', fontSize: '0.875rem', opacity: 0.5 }}>
            Engage in meaningful conversations with your AI companion.
          </p>
        </div>

        <div style={{ 
          borderRadius: '0.5rem', 
          border: '1px solid transparent', 
          padding: '1.25rem', 
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Growth Tracking
          </h3>
          <p style={{ margin: 0, maxWidth: '30ch', fontSize: '0.875rem', opacity: 0.5 }}>
            Monitor your personal development journey over time.
          </p>
        </div>

        <div style={{ 
          borderRadius: '0.5rem', 
          border: '1px solid transparent', 
          padding: '1.25rem', 
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Wellness Tools
          </h3>
          <p style={{ margin: 0, maxWidth: '30ch', fontSize: '0.875rem', opacity: 0.5 }}>
            Access therapeutic exercises and mindfulness resources.
          </p>
        </div>
      </div>
    </main>
  )
} 